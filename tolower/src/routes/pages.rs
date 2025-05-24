use std::{path::PathBuf, sync::Arc};

use axum::{extract::State, http::{header, HeaderMap, HeaderValue}, response::IntoResponse};

use crate::AppData;

pub async fn save(State(data): State<Arc<AppData>>) -> impl IntoResponse {
    let headers = HeaderMap::from_iter(vec![
        (
            header::CONTENT_DISPOSITION,
            HeaderValue::from_static("attachment; filename=\"drawing.drinfo\""),
        ),
    ].into_iter());
    (headers, save_drawing(&*data.drawing.lock().await))
}

fn save_drawing(drawing: &drawing::Drawing) -> Vec<u8> {
    let mut test = vec![];
    ciborium::ser::into_writer(drawing, &mut test).unwrap();
    test
}
