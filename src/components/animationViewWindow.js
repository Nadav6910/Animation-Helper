import "../styles/animationviewwindow.css"

export default function AnimationViewWindow(props) {

    //remove the play class and reset animation to be ready to play again
    const resetAnimationState = () => {
        document.getElementById("animated-text").classList.remove("play")
    }

    return (
        <div className="animation-view-window">
            <p id="animated-text" className="animated-text" onAnimationEnd={resetAnimationState}>{props.text && props.text}</p>
        </div>
    )
}