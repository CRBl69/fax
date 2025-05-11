use std::sync::{Arc, Mutex};

use actix_web::{
    get,
    web::{self, Data},
    App, Error, HttpRequest, HttpResponse, HttpServer,
};
use actix_web_actors::ws;
use actix_http::ws::Codec;
use drawing::Drawing;
use log::*;

use crate::{ws::handler::WebSocketHandler, AppData};

#[get("/ws/{username}")]
pub async fn accept_ws(
    req: HttpRequest,
    stream: web::Payload,
    username: web::Path<(String,)>,
    data: Data<AppData>,
) -> Result<HttpResponse, Error> {
    let username = username.into_inner().0;
    let codec = Codec::new();
    let codec = codec.max_size(1048576);
    let resp = ws::WsResponseBuilder::new(WebSocketHandler {
            drawing: Arc::clone(&data.drawing),
            server: data.server.clone(),
            username,
        }, &req, stream)
        .codec(codec)
        .start();
    info!("New websocket client connected");
    resp
}
