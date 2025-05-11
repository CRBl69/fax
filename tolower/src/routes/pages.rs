use std::path::PathBuf;

use actix_files::NamedFile;
use actix_web::{get, Result, web::Data};

use crate::AppData;

#[get("/")]
pub async fn index() -> Result<NamedFile> {
    let path: PathBuf = PathBuf::from("static/index.html");
    Ok(NamedFile::open(path)?)
}

#[get("/save")]
pub async fn save(
    data: Data<AppData>,
) -> Result<NamedFile> {
    let drawig = data.drawing.lock().unwrap();
    Ok(NamedFile::open(save_drawing(&drawig).as_path())?)
}

fn save_drawing(drawing: &drawing::Drawing) -> PathBuf {
    let path = std::env::temp_dir().as_path().join("drawing_temp.drinfo");
    let file = std::fs::File::create(path.clone()).unwrap();
    ciborium::ser::into_writer(drawing, file).unwrap();
    path
}
