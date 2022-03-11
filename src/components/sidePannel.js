import "../styles/sidepannel.css"
import TranslateSection from "./TranslateSection"

export default function SidePannel(props) {
    
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

            <div className="text-input-container">
                <h4 className="text-input-info">Write Something To Animate</h4>
                <textarea className="animation-text-input" onChange={ForwardInputText} maxLength="100" placeholder="type here..." cols="30" rows="10"></textarea>
            </div>

            <TranslateSection 
                translatexf={(state) => document.querySelector(':root').style.setProperty('--translateX-from', `translateX(${state + "px"})`)} 
                translatext={(state) => document.querySelector(':root').style.setProperty('--translateX-to', `translateX(${state + "px"})`)}
                translateyf={(state) => document.querySelector(':root').style.setProperty('--translateY-from', `translateY(${state + "px"})`)}
                translateyt={(state) => document.querySelector(':root').style.setProperty('--translateY-to', `translateY(${state + "px"})`)}
                />

            <button className="trigger-animation-btn" onClick={triggerAnimation}>Play</button>
        </div>
    )
}