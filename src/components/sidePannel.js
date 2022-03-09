import "../styles/sidepannel.css"

export default function SidePannel(props) {

    // document.querySelector(':root').style.setProperty('--scaleX-to', "scaleX(5)") - changing css vars code
    
    //send the user input text to the animation pannel and animated
    const ForwardInputText = (e) => {
        props.text(e.target.value)
    }

    //trigger the animation on button click by giving it the play class
    const triggerAnimation = () => {
        document.getElementById("animated-text").classList.add("play")
    }

    return (
        <div className="side-pannel">
            <h4 className="text-input-info">Write Something To Animate</h4>
            <textarea className="animation-text-input" onChange={ForwardInputText} maxLength="100" placeholder="type here..." cols="30" rows="10"></textarea>

            <button className="trigger-animation-btn" onClick={triggerAnimation}>Play</button>
        </div>
    )
}