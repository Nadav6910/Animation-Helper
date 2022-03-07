import "../styles/animationviewwindow.css"

export default function AnimationViewWindow(props) {
    return (
        <div className="animation-view-window">
            <p className="animated-text">{props.text && props.text}</p>
        </div>
    )
}