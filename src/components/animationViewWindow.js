import "../styles/animationviewwindow.css"

export default function AnimationViewWindow(props) {

    //remove the play class and reset animation to be ready to play again
    const resetAnimationState = () => {
        !props.mode && document.getElementById("animated-text").classList.remove("play")
        props.mode && document.querySelector(".animated-shape").classList.remove("play")
    }

    return (
        <div className="animation-view-window">
            {props.mode ? null : <p id="animated-text" className="animated-text" onAnimationEnd={resetAnimationState}>{props.text && props.text}</p>}
            {props.mode ? <div style={{"width": "5em", "height": "5em"}} onAnimationEnd={resetAnimationState} className={props.shape + " animated-shape"}></div> : null}
        </div>
    )
}