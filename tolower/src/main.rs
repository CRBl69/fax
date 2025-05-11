#![allow(unused)]
use actix::prelude::*;
use actix_web::web::Data;
use actix_web::{App, HttpServer};
use clap::Parser;
use log::*;
use std::collections::HashMap;
use std::io::Write;
use std::sync::{Arc, Mutex};

use drawing::Drawing;

mod args;
mod routes;
mod ws;

pub struct AppData {
    pub drawing: Arc<Mutex<Drawing>>,
    pub server: Addr<ws::server::WebSocketServer>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    let args = args::Args::parse();
    let port = args.port;
    let drawing = if let Some(file) = args.file.clone() {
        let f = std::fs::File::open(file).expect("File not found.");
        ciborium::de::from_reader(f).unwrap()
    } else {
        Drawing::new(1080, 1920)
    };
    let drawing = Mutex::new(drawing);
    let websocket_server = ws::server::WebSocketServer {
        users: HashMap::new(),
    }
    .start();
    let app_data = Data::new(AppData {
        drawing: Arc::new(drawing),
        server: websocket_server.clone(),
    });
    info!("Starting server on port {port}");
    HttpServer::new(move || {
        App::new()
            .app_data(Data::new(args.clone()))
            .app_data(app_data.clone())
            .service(routes::pages::index)
            .service(routes::pages::save)
            .service(routes::ws::accept_ws)
    })
    .bind(format!("0.0.0.0:{port}"))?
    .run()
    .await?;
    info!("Server stopped");
    Ok(())
}
