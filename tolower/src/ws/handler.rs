use std::sync::{Arc, Mutex};

use actix::prelude::*;
use actix_web::{web, App, Error, HttpRequest, HttpResponse, HttpServer};
use actix_web_actors::ws;
use drawing::Drawing;
use log::*;

use crate::ws::{messages::WebSocketMessage, server::CursorMessage};

use super::server::WebSocketServer;

pub struct WebSocketHandler {
    pub drawing: Arc<Mutex<Drawing>>,
    pub server: Addr<WebSocketServer>,
    pub username: String,
}

impl Actor for WebSocketHandler {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        let addr = ctx.address();
        let res = self.server
            .send(super::server::Connection {
                addr,
                username: self.username.clone(),
            })
            .into_actor(self)
            .then(|res, _, ctx| {
                if res.is_err() || !res.unwrap() {
                    ctx.close(Some(actix_web_actors::ws::CloseReason{ code: actix_web_actors::ws::CloseCode::Error, description: Some("Another user with this username already exists.".to_owned()) }))
                }
                fut::ready(())
            })
            .wait(ctx);
    }
}

impl WebSocketHandler {
    fn handle_text_message(&self, text: &str, ctx: &mut ws::WebsocketContext<Self>) {
        info!("Incomming websocket message from {}: {text}", self.username);
        if let Ok(m) = serde_json::from_str::<WebSocketMessage>(text) {
            match m.clone() {
                WebSocketMessage::Instruction(instruction) => {
                    let mut drawing = self.drawing.lock().unwrap();
                    let res = drawing.instruct(instruction.instruction, &instruction.layer);
                    if res.is_ok() {
                        self.server.send(m)
                            .into_actor(self)
                            .then(|_, _, _| fut::ready(()))
                            .wait(ctx);
                    }
                }
                WebSocketMessage::CursorIn(cursor) => {
                    self.server
                        .send(CursorMessage {
                            username: self.username.to_string(),
                            information: cursor,
                        })
                        .into_actor(self)
                        .then(|_, _, _| fut::ready(()))
                        .wait(ctx);
                }
                WebSocketMessage::Undo(layer_name) => {
                    let mut drawing = self.drawing.lock().unwrap();
                    let layer = drawing.get_layer_mut(&layer_name);
                    if let Some(layer) = layer {
                        layer.undo();
                    }
                    self.server.send(m)
                            .into_actor(self)
                            .then(|_, _, _| fut::ready(()))
                            .wait(ctx);
                }
                WebSocketMessage::Redo(layer_name) => {
                    let mut drawing = self.drawing.lock().unwrap();
                    let layer = drawing.get_layer_mut(&layer_name);
                    if let Some(layer) = layer {
                        layer.redo();
                    }
                    self.server.send(m)
                            .into_actor(self)
                            .then(|_, _, _| fut::ready(()))
                            .wait(ctx);
                }
                WebSocketMessage::AddLayer(layer_name) => {
                    let mut drawing = self.drawing.lock().unwrap();
                    drawing.add_layer(&layer_name);
                    self.server.send(m)
                            .into_actor(self)
                            .then(|_, _, _| fut::ready(()))
                            .wait(ctx);
                }
                WebSocketMessage::LayerUp(layer_name) => {
                    let mut drawing = self.drawing.lock().unwrap();
                    drawing.layer_up(&layer_name);
                    self.server.send(m)
                            .into_actor(self)
                            .then(|_, _, _| fut::ready(()))
                            .wait(ctx);
                }
                WebSocketMessage::LayerDown(layer_name) => {
                    let mut drawing = self.drawing.lock().unwrap();
                    drawing.layer_down(&layer_name);
                    self.server.send(m)
                            .into_actor(self)
                            .then(|_, _, _| fut::ready(()))
                            .wait(ctx);
                }
                WebSocketMessage::ToggleLayerVisibility(layer_name) => {
                    let mut drawing = self.drawing.lock().unwrap();
                    let layer = drawing.get_layer_mut(&layer_name);
                    if let Some(layer) = layer {
                        layer.toggle_visibility();
                    }
                    self.server.send(m)
                            .into_actor(self)
                            .then(|_, _, _| fut::ready(()))
                            .wait(ctx);
                }
                WebSocketMessage::RequestInit => {
                    self.server.send(super::server::RequestInitMessage{name: self.username.to_owned(), drawing: self.drawing.lock().unwrap().to_owned()})
                            .into_actor(self)
                            .then(|_, _, _| fut::ready(()))
                            .wait(ctx);
                }
                WebSocketMessage::TempDraw(data) => {
                    self.server.send(super::server::TempDrawMessage{data, username: self.username.to_string()})
                            .into_actor(self)
                            .then(|_, _, _| fut::ready(()))
                            .wait(ctx);
                }
                // Onlt sent by the server thus they should be ignored
                WebSocketMessage::CursorOut(_) => {}
                WebSocketMessage::Init(_) => {}
                WebSocketMessage::Join(_) => {}
            }
        } else {
            error!("Could not parse message");
        };
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WebSocketHandler {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(msg)) => ctx.pong(&msg),
            Ok(ws::Message::Text(text)) => self.handle_text_message(&text, ctx),
            Ok(ws::Message::Binary(bin)) => ctx.binary(bin),
            Ok(ws::Message::Close(_)) => {
                self.server.do_send(super::server::Disconnection(self.username.to_owned()));
                ctx.stop();
            }
            a => log::info!("{:#?}", a)
        }
    }

    fn finished(&mut self, ctx: &mut Self::Context) {
        self.server.do_send(super::server::Disconnection(self.username.to_owned()));
        ctx.stop();
    }
}

impl Handler<WebSocketMessage> for WebSocketHandler {
    type Result = ();

    fn handle(&mut self, msg: WebSocketMessage, ctx: &mut Self::Context) -> Self::Result {
        ctx.text(serde_json::to_string(&msg).unwrap());
    }
}

