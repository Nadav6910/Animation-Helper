import "../styles/animationpannel.css"
import SidePannel from "./sidePannel"
import AnimationViewWindow from "./animationViewWindow"
import CodePreview from "./codePreview"
import { useState } from "react"

export default function AnimationPannel(props) {

    //selecting between text and shape modes
    const [mode, setMode] = useState(false)
    //state of text sent from the side pannel
    const [textToAnimate, setTextToAnimate] = useState("")
    //selected shape from side pannel
    const [shapeToAnimate, setshapeToAnimate] = useState("")
    //selected user values for animations
    const [animationsValues, setAnimationsValues] = useState()

    //changing between text and shape modes
    const changeMode = (mode) => {
        setMode(mode)
     }

    //get user input text from side pannel component and set it to a state
    const setText = (inputText) => {
       setTextToAnimate(inputText)
    }

    //get user selected shape from side pannel component and set it to a state
    const setShape = (selectedShape) => {
        setshapeToAnimate(selectedShape)
     }

    //getting use chosen animation values from side pannel
    const getAnimationsValues = (values) => {
        setAnimationsValues(values)
    }
    
    return (
        <div className="animation-pannel">
            <SidePannel mode={changeMode} shape={setShape} text={setText} animationsValue={getAnimationsValues}/>
            <section className="main-section">
                <p className="about-p">A tool for developers to create and test animations fast and easy.<br/> see the created animations here:</p>
                <AnimationViewWindow mode={mode} shape={shapeToAnimate} text={textToAnimate}/>
                <CodePreview mode={mode} animationsValues={animationsValues}/>
            </section>
        </div>
    )
}