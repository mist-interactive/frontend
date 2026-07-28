export default function GodotGame() {
    // components return
    return (
        // container locked exactly to parent layout boundaries
        <div className="absolute inset-0 bg-black">
            <iframe
                src="/game/index.html"
                className="w-full h-full border-none block"
                style={{ overflow: 'hidden' }}
                scrolling="no"
                title="Godot Game"
            />
        </div>
    );
}