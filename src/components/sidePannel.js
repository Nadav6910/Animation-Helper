import "../styles/sidepannel.css"
import PlusIcon from "./plusIcon"
import MinusIcon from "./minusIcon"
import { useState } from "react"

export default function SidePannel(props) {

    const [translateXFrom, setTranslateXFrom] = useState("")
    const [translateYFrom, setTranslateYFrom] = useState("")
    const [translateXTo, setTranslateXTo] = useState("")
    const [translateYTo, setTranslateYTo] = useState("")

    // document.querySelector(':root').style.setProperty('--scaleX-to', "scaleX(5)") - changing css vars code
    
    //send the user input text to the animation pannel and animated
    const ForwardInputText = (e) => {
        props.text(e.target.value)
    }

    //trigger the animation on button click by giving it the play class
    const triggerAnimation = () => {
        document.getElementById("animated-text").classList.add("play")
    }

    //limit number of input digits to the maxLength atrribute
    const inputHandler = (e) => {
        const { value, maxLength } = e.target;
        if (String(value).length >= maxLength) {
          e.preventDefault();
          return;
        }
      };

    return (
        <div className="side-pannel">

            <div className="text-input-container">
                <h4 className="text-input-info">Write Something To Animate</h4>
                <textarea className="animation-text-input" onChange={ForwardInputText} maxLength="100" placeholder="type here..." cols="30" rows="10"></textarea>
            </div>

            <div className="translate-controls-container">
                    <h4 className="info-title">Translate</h4>

                    <div className="sub-titles">
                        <h6 className="info-title">Translate-X</h6>
                        <h6 className="info-title">Translate-Y</h6>
                    </div>

                    <div className="controls-input-container">
                        <div className="X-section">

                            <div className="control-from">
                                <p className="from-text">From</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => setTranslateXFrom(Number(translateXFrom) + 1)}/>
                                    <input value={translateXFrom} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => setTranslateXFrom(e.target.value)} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={(e) =>["e", "E", "+"].includes(e.key) && e.preventDefault()}/>
                                    <MinusIcon minus={() => setTranslateXFrom(Number(translateXFrom) - 1)}/>
                                </div>
                            </div>

                            <div className="control-to">
                                <p className="to-text">To</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => setTranslateXTo(Number(translateXTo) + 1)}/>
                                    <input 
                                        value={translateXTo} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => setTranslateXTo(e.target.value)} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={(e) =>["e", "E", "+"].includes(e.key) && e.preventDefault()}/>
                                    <MinusIcon minus={() => setTranslateXTo(Number(translateXTo) - 1)}/>
                                </div>
                            </div>

                        </div>

                        <div className="Y-section">

                            <div className="control-from">
                                <p className="from-text">From</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => setTranslateYFrom(Number(translateYFrom) + 1)}/>
                                    <input 
                                        value={translateYFrom} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => setTranslateYFrom(e.target.value)} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={(e) =>["e", "E", "+"].includes(e.key) && e.preventDefault()}/>
                                    <MinusIcon minus={() => setTranslateYFrom(Number(translateYFrom) - 1)}/>
                                </div>
                            </div>

                            <div className="control-to">
                                <p className="to-text">To</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => setTranslateYTo(Number(translateYTo) + 1)}/>
                                    <input 
                                        value={translateYTo} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => setTranslateYTo(e.target.value)} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={(e) =>["e", "E", "+"].includes(e.key) && e.preventDefault()}/>
                                    <MinusIcon minus={() => setTranslateYTo(Number(translateYTo) - 1)}/>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>

            {/* <button className="trigger-animation-btn" onClick={triggerAnimation}>Play</button> */}
        </div>
    )
}