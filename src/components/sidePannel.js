import "../styles/sidepannel.css"
import TranslateSection from "./TranslateSection"
import { useState } from "react"


export default function SidePannel(props) {

    // onject that will contain all animations data to be sent to code preview component
    const [animationsValues] = useState({translatexf: 0, translatext: 0, translateyf: 0, translateyt: 0})

    //getting the element that will be animated
    const animatedText = document.getElementById("animated-text")

    //send the user input text to the animation pannel and animated
    const ForwardInputText = (e) => {
        props.text(e.target.value)
    }

    //trigger the animation on button click by giving it the play class
    const triggerAnimation = () => {
        animatedText && animatedText.classList.add("play")
        props.animationsValue(animationsValues)
    }

    return (
        <>
        <div className="side-pannel">

            <div className="text-input-container">
                <h4 className="text-input-info">Write Something To Animate</h4>
                <textarea className="animation-text-input" onChange={ForwardInputText} maxLength="100" placeholder="type here..." cols="30" rows="10"></textarea>
            </div>

            <TranslateSection 
                translatexf={(state) => {
                    document.querySelector(':root').style.setProperty('--translateX-from', `translateX(${state + "px"})`)
                    if (state !== 0 || state !== "0") {animationsValues.translatexf = state}
                    }} 
                translatext={(state) => {
                    document.querySelector(':root').style.setProperty('--translateX-to', `translateX(${state + "px"})`)
                    if (state !== 0 || state !== "0") {animationsValues.translatext = state}
                    }}
                translateyf={(state) => {
                    document.querySelector(':root').style.setProperty('--translateY-from', `translateY(${state + "px"})`)
                    if (state !== 0 || state !== "0") {animationsValues.translateyf = state}
                    }}
                translateyt={(state) => {
                    document.querySelector(':root').style.setProperty('--translateY-to', `translateY(${state + "px"})`)
                    if (state !== 0 || state !== "0") {animationsValues.translateyt = state}
                    }}
                />

            <button className="trigger-animation-btn" onClick={triggerAnimation}>Play</button>
        </div>

        <div className="hamburger-menu">
            <input id="menu__toggle" type="checkbox" />
            <label className="menu__btn" htmlFor="menu__toggle">
            <span></span>
            </label>

            <ul className="menu__box">
                <li className="menu__item">
                    <div className="side-pannel">
                        <div className="text-input-container">
                            <h4 className="text-input-info">Write Something To Animate</h4>
                            <textarea className="animation-text-input" onChange={ForwardInputText} maxLength="100" placeholder="type here..." cols="30" rows="10"></textarea>
                        </div>

                        <TranslateSection 
                            translatexf={(state) => {
                                document.querySelector(':root').style.setProperty('--translateX-from', `translateX(${state + "px"})`)
                                if (state !== 0 || state !== "0") {animationsValues.translatexf = state}
                                }} 
                            translatext={(state) => {
                                document.querySelector(':root').style.setProperty('--translateX-to', `translateX(${state + "px"})`)
                                if (state !== 0 || state !== "0") {animationsValues.translatext = state}
                                }}
                            translateyf={(state) => {
                                document.querySelector(':root').style.setProperty('--translateY-from', `translateY(${state + "px"})`)
                                if (state !== 0 || state !== "0") {animationsValues.translateyf = state}
                                }}
                            translateyt={(state) => {
                                document.querySelector(':root').style.setProperty('--translateY-to', `translateY(${state + "px"})`)
                                if (state !== 0 || state !== "0") {animationsValues.translateyt = state}
                                }}
                            />

                        <button className="trigger-animation-btn" onClick={triggerAnimation}>Play</button>
                    </div>
                </li>
            </ul>
        </div>
        </>
    )
}