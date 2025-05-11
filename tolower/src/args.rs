use clap::Parser;

/// A web drawing software to draw with your friends
#[derive(Parser, Debug, Clone)]
#[clap(author, version, about, long_about = None)]
pub struct Args {
    /// Port on which to listen for connections
    #[clap(short, long, default_value_t = 8079)]
    pub port: u16,

    /// Path to the directory containing the generated files
    #[clap(short, long)]
    pub file: Option<String>,
}
