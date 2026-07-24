export default function GodotGame() {
    console.log("--->");
    return (
        <iframe
            src="/webport/webport.html"
            style={{
                width: "100%",
                height: "100%",
                border: "none",
            }}
            title="Godot Game"
        />
    );
}