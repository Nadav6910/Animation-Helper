import "../styles/animationpannel.css"
import SidePannel from "./sidePannel"
import AnimationViewWindow from "./animationViewWindow"
import CodePreview from "./codePreview"
import { useState } from "react"

export default function AnimationPannel(props) {

    //state of text sent from the side pannel
    const [textToAnimate, setTextToAnimate] = useState("")
    const [animationsValues, setAnimationsValues] = useState()

    //get user input text from side pannel component and set it to a state
    const setText = (inputText) => {
       setTextToAnimate(inputText)
    }

    const getAnimationsValues = (values) => {
        console.log(values);
        setAnimationsValues(values)
    }
    
    return (
        <div className="animation-pannel">
            <SidePannel text={setText} animationsValue={getAnimationsValues}/>
            <section className="main-section">
                <p className="about-p">A tool for developers to create and test animations fast and easy.<br/> see the created animations here:</p>
                <AnimationViewWindow text={textToAnimate}/>
                <CodePreview animationsValues={animationsValues}/>
            </section>
        </div>
    )
}