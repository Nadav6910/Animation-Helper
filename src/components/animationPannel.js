import "../styles/animationpannel.css"
import SidePannel from "./sidePannel"
import AnimationViewWindow from "./animationViewWindow"
import { useState } from "react"

export default function AnimationPannel() {

    //state of text sent from the side pannel
    const [textToAnimate, setTextToAnimate] = useState("")

    //get user input text from side pannel component and set it to a state
    const setText = (inputText) => {
       setTextToAnimate(inputText)
    }
    
    return (
        <div className="animation-pannel">
            <SidePannel text={setText}/>
            <section className="main-section">
                <p className="about-p">A tool for developers to create and test animations fast and easy.<br/> see the created animations here:</p>
                <AnimationViewWindow text={textToAnimate}/>
            </section>
        </div>
    )
}