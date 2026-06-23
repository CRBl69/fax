use std::sync::Arc;

use axum::{extract::{ws::{Message, WebSocket}, Path, State, WebSocketUpgrade}, response::IntoResponse};
use drawing::Drawing;
use futures::{SinkExt as _, StreamExt as _};
use log::*;
use tokio::sync::Mutex;

use crate::{ws::{messages::{InitData, WebSocketMessage}}, AppData};

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(username): Path<String>,
    State(data): State<Arc<AppData>>
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, username, data))
}

pub async fn handle_socket(
    socket: WebSocket,
    username: String,
    app_data: Arc<AppData>,
) {
    let (mut sender, mut receiver) = socket.split();
    let sender = Arc::new(Mutex::new(sender));

    app_data.users.lock().await.insert(username.clone(), sender.clone());

    while let Some(Ok(msg)) = receiver.next().await {
        let Ok(text) = msg.to_text() else {
            return;
        };
        info!("Incomming websocket message from {username}: {text}");
        if let Ok(m) = serde_json::from_str::<WebSocketMessage>(text) {
            match m.clone() {
                WebSocketMessage::Instruction(instruction) => {
                    if app_data
                        .drawing
                        .lock()
                        .await
                        .instruct(&instruction.layer, instruction.instruction)
                        .is_ok()
                    {
                        let mut users = app_data.users.lock().await;
                        for user in users.values_mut() {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::CursorIn(cursor) => {
                    let mut users = app_data.users.lock().await;
                    for (name, user) in users.iter_mut() {
                        if name != &username {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::SetHistoryIndex(data) => {
                    if app_data
                        .drawing
                        .lock()
                        .await
                        .set_history_index(&data.layer, data.new_history_index)
                        .is_ok()
                    {
                        let mut users = app_data.users.lock().await;
                        for user in users.values_mut() {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::MoveInstruction(data) => {
                    if app_data
                        .drawing
                        .lock()
                        .await
                        .move_instruction(
                            &data.layer,
                            data.old_instruction_index,
                            data.new_instruction_index,
                        )
                        .is_ok()
                    {
                        let mut users = app_data.users.lock().await;
                        for user in users.values_mut() {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::AddLayer(layer_name) => {
                    if app_data.drawing.lock().await.add_layer(layer_name).is_ok() {
                        let mut users = app_data.users.lock().await;
                        for user in users.values_mut() {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::LayerUp(layer_name) => {
                    if app_data.drawing.lock().await.layer_up(&layer_name).is_ok() {
                        let mut users = app_data.users.lock().await;
                        for user in users.values_mut() {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::LayerDown(layer_name) => {
                    if app_data.drawing.lock().await.layer_down(&layer_name).is_ok() {
                        let mut users = app_data.users.lock().await;
                        for user in users.values_mut() {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::SetLayerVisibility(data) => {
                    if app_data
                        .drawing
                        .lock()
                        .await
                        .set_visibility(&data.layer, data.visible)
                        .is_ok()
                    {
                        let mut users = app_data.users.lock().await;
                        for user in users.values_mut() {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::RequestInit => {
                    sender.lock().await.send(Message::text(serde_json::to_string(&WebSocketMessage::Init(InitData {
                        drawing: app_data.drawing.lock().await.clone(),
                        users: app_data.users.lock().await.keys().cloned().collect(),
                    })).unwrap())).await;
                }
                WebSocketMessage::TempDraw(data) => {
                    let mut users = app_data.users.lock().await;
                    for (name, user) in users.iter_mut() {
                        if name != &username {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::TempSelect(_) => {
                    let mut users = app_data.users.lock().await;
                    for (name, user) in users.iter_mut() {
                        if name != &username {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::TempImage(_) => {
                    let mut users = app_data.users.lock().await;
                    for (name, user) in users.iter_mut() {
                        if name != &username {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::TempMove(_) => {
                    let mut users = app_data.users.lock().await;
                    for (name, user) in users.iter_mut() {
                        if name != &username {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::Snapshot(data) => {
                    if app_data
                        .drawing
                        .lock()
                        .await
                        .snapshot(&data.layer, data.index, data.data)
                        .is_ok()
                    {
                        let mut users = app_data.users.lock().await;
                        for user in users.values_mut() {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::SetInstructionVisibility(data) => {
                    if app_data
                        .drawing
                        .lock()
                        .await
                        .set_instruction_visibility(&data.layer, data.index, data.visible)
                        .is_ok()
                    {
                        let mut users = app_data.users.lock().await;
                        for user in users.values_mut() {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                WebSocketMessage::RemoveInstruction(data) => {
                    if app_data
                        .drawing
                        .lock()
                        .await
                        .remove_instruction(&data.layer, data.index)
                        .is_ok()
                    {
                        let mut users = app_data.users.lock().await;
                        for user in users.values_mut() {
                            user.lock().await.send(msg.clone()).await;
                        }
                    }
                }
                // Only sent by the server thus they should be ignored
                WebSocketMessage::CursorOut(_) => {}
                WebSocketMessage::Init(_) => {}
                WebSocketMessage::Join(_) => {}
            }
        } else {
            error!("Could not parse message: {msg:?}");
        };
    }

    app_data.users.lock().await.remove(&username);
}
