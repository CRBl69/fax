use std::collections::HashMap;

use actix::prelude::*;
use actix::Message;
use log::info;

use super::messages::CursorDataIn;
use super::messages::CursorDataOut;
use super::messages::WebSocketMessage;

pub struct WebSocketServer {
    pub users: HashMap<String, Addr<super::handler::WebSocketHandler>>,
}

#[derive(Message)]
#[rtype(result = "bool")]
pub struct Connection {
    pub addr: Addr<super::handler::WebSocketHandler>,
    pub username: String,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnection(pub String);

#[derive(Message)]
#[rtype(result = "()")]
pub struct CursorMessage {
    pub information: CursorDataIn,
    pub username: String,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct RequestInitMessage {
    pub drawing: crate::Drawing,
    pub name: String,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct TempDrawMessage {
    pub data: super::messages::TempDrawData,
    pub username: String,
}

impl Actor for WebSocketServer {
    type Context = Context<Self>;
}

impl Handler<WebSocketMessage> for WebSocketServer {
    type Result = ();

    fn handle(&mut self, msg: WebSocketMessage, ctx: &mut Context<Self>) {
        self.users.iter().for_each(|user| {
            user.1
                .send(msg.clone())
                .into_actor(self)
                .then(|_, _, _| fut::ready(()))
                .wait(ctx);
        })
    }
}

impl Handler<CursorMessage> for WebSocketServer {
    type Result = ();

    fn handle(&mut self, msg: CursorMessage, ctx: &mut Context<Self>) {
        let mut cursor_data = CursorDataOut::from_recieved(msg.information, msg.username.clone());
        let message = WebSocketMessage::CursorOut(cursor_data);
        self.users.iter().for_each(|user| {
            if *user.0 != msg.username {
                info!("Sending cursor from {} to {}.", msg.username, user.0);
                user.1.send(message.clone())
                    .into_actor(self)
                    .then(|_, _, _| fut::ready(()))
                    .wait(ctx);

            }
        })
    }
}

impl Handler<Connection> for WebSocketServer {
    type Result = bool;

    fn handle(&mut self, msg: Connection, ctx: &mut Context<Self>) -> bool {
        if self.users.contains_key(&msg.username) {
            false
        } else {
            self.users.iter().for_each(|user| {
                user.1
                    .send(WebSocketMessage::Join(msg.username.clone()))
                    .into_actor(self)
                    .then(|_, _, _| fut::ready(()))
                    .wait(ctx);
            });
            self.users.insert(msg.username, msg.addr);
            true
        }
    }
}

impl Handler<Disconnection> for WebSocketServer {
    type Result = ();

    fn handle(&mut self, msg: Disconnection, ctx: &mut Context<Self>) {
        info!("User {} disconnected.", msg.0);
        self.users.remove(&msg.0);
    }
}

impl Handler<RequestInitMessage> for WebSocketServer {
    type Result = ();

    fn handle(&mut self, msg: RequestInitMessage, ctx: &mut Self::Context) -> Self::Result {
        let message =
            super::messages::WebSocketMessage::Init(super::messages::InitData {
                drawing: msg.drawing,
                users: self.users.clone().keys().into_iter().map(|a| a.to_owned()).collect()
            });
        let json = serde_json::to_string(&message).unwrap();
        self.users.get(&msg.name).unwrap()
            .send(message)
            .into_actor(self)
            .then(|_, _, _| fut::ready(()))
            .wait(ctx);;
    }
}

impl Handler<TempDrawMessage> for WebSocketServer {
    type Result = ();

    fn handle(&mut self, msg: TempDrawMessage, ctx: &mut Self::Context) -> Self::Result {
        let message = WebSocketMessage::TempDraw(msg.data);
        self.users.iter().for_each(|user| {
            if *user.0 != msg.username {
                user.1.send(message.clone())
                    .into_actor(self)
                    .then(|_, _, _| fut::ready(()))
                    .wait(ctx);

            }
        })
    }
}
