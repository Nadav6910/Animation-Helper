import "../styles/sidepannel.css"
import TranslateSection from "./TranslateSection"
import RotateSection from "./RotateSection"
import SkewSection from "./SkewSection"
import ScaleSection from "./ScaleSection"
import { useState } from "react"


export default function SidePannel(props) {

    // onject that will contain all animations data to be sent to code preview component
    const [animationsValues] = useState({
        translatexf: 0,
        translatext: 0, 
        translateyf: 0, 
        translateyt: 0, 
        rotatexf: 0, 
        rotatext: 0, 
        rotateyf: 0, 
        rotateyt: 0,
        skewxf: 0, 
        skewxt: 0, 
        skewyf: 0, 
        skewyt:0,
        scalexf: 0, 
        scalext: 0, 
        scaleyf: 0, 
        scaleyt:0
    })

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
        <div className="side-pannel desktop">

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

                <RotateSection 
                    rotatexf={(state) => {
                        document.querySelector(':root').style.setProperty('--rotateX-from', `rotateX(${state + "deg"})`)
                        if (state !== 0 || state !== "0") {animationsValues.rotatexf = state}
                        }} 
                    rotatext={(state) => {
                        document.querySelector(':root').style.setProperty('--rotateX-to', `rotateX(${state + "deg"})`)
                        if (state !== 0 || state !== "0") {animationsValues.rotatext = state}
                        }}
                    rotateyf={(state) => {
                        document.querySelector(':root').style.setProperty('--rotateY-from', `rotateY(${state + "deg"})`)
                        if (state !== 0 || state !== "0") {animationsValues.rotateyf = state}
                        }}
                    rotateyt={(state) => {
                        document.querySelector(':root').style.setProperty('--rotateY-to', `rotateY(${state + "deg"})`)
                        if (state !== 0 || state !== "0") {animationsValues.rotateyt = state}
                        }}
                />

                <SkewSection 
                    skewxf={(state) => {
                        document.querySelector(':root').style.setProperty('--skewX-from', `skewX(${state + "deg"})`)
                        if (state !== 0 || state !== "0") {animationsValues.skewxf = state}
                        }} 
                    skewxt={(state) => {
                        document.querySelector(':root').style.setProperty('--skewX-to', `skewX(${state + "deg"})`)
                        if (state !== 0 || state !== "0") {animationsValues.skewxt = state}
                        }}
                    skewyf={(state) => {
                        document.querySelector(':root').style.setProperty('--skewY-from', `skewY(${state + "deg"})`)
                        if (state !== 0 || state !== "0") {animationsValues.skewyf = state}
                        }}
                    skewyt={(state) => {
                        document.querySelector(':root').style.setProperty('--skewY-to', `skewY(${state + "deg"})`)
                        if (state !== 0 || state !== "0") {animationsValues.skewyt = state}
                        }}
                />

                <ScaleSection 
                    scalexf={(state) => {
                        document.querySelector(':root').style.setProperty('--scaleX-from', `scaleX(${state})`)
                        if (state !== 0 || state !== "0") {animationsValues.scalexf = state}
                        }} 
                    scalext={(state) => {
                        document.querySelector(':root').style.setProperty('--scaleX-to', `scaleX(${state})`)
                        if (state !== 0 || state !== "0") {animationsValues.scalext = state}
                        }}
                    scaleyf={(state) => {
                        document.querySelector(':root').style.setProperty('--scaleY-from', `scaleY(${state})`)
                        if (state !== 0 || state !== "0") {animationsValues.scaleyf = state}
                        }}
                    scaleyt={(state) => {
                        document.querySelector(':root').style.setProperty('--scaleY-to', `scaleY(${state})`)
                        if (state !== 0 || state !== "0") {animationsValues.scaleyt = state}
                        }}
                />

            <button className="trigger-animation-btn" onClick={triggerAnimation}>Play<span>
                    <svg className="svg-icon-play" viewBox="0 0 20 20">
                        <path className="path-icon-play" fill="none" d="M11.611,10.049l-4.76-4.873c-0.303-0.31-0.297-0.804,0.012-1.105c0.309-0.304,0.803-0.293,1.105,0.012l5.306,5.433c0.304,0.31,0.296,0.805-0.012,1.105L7.83,15.928c-0.152,0.148-0.35,0.223-0.547,0.223c-0.203,0-0.406-0.08-0.559-0.236c-0.303-0.309-0.295-0.803,0.012-1.104L11.611,10.049z"></path>
                    </svg>
                </span>
            </button>
        </div>

        <div className="hamburger-menu">
            <input id="menu__toggle" type="checkbox" />
            <label className="menu__btn" htmlFor="menu__toggle">
            <span></span>
            </label>

            <ul className="menu__box">
                <li className="menu__item">
                    <div className="side-pannel mobile">
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

                        <RotateSection 
                            rotatexf={(state) => {
                                document.querySelector(':root').style.setProperty('--rotateX-from', `rotateX(${state + "deg"})`)
                                if (state !== 0 || state !== "0") {animationsValues.rotatexf = state}
                                }} 
                            rotatext={(state) => {
                                document.querySelector(':root').style.setProperty('--rotateX-to', `rotateX(${state + "deg"})`)
                                if (state !== 0 || state !== "0") {animationsValues.rotatext = state}
                                }}
                            rotateyf={(state) => {
                                document.querySelector(':root').style.setProperty('--rotateY-from', `rotateY(${state + "deg"})`)
                                if (state !== 0 || state !== "0") {animationsValues.rotateyf = state}
                                }}
                            rotateyt={(state) => {
                                document.querySelector(':root').style.setProperty('--rotateY-to', `rotateY(${state + "deg"})`)
                                if (state !== 0 || state !== "0") {animationsValues.rotateyt = state}
                                }}
                        />

                        <SkewSection 
                            skewxf={(state) => {
                                document.querySelector(':root').style.setProperty('--skewX-from', `skewX(${state + "deg"})`)
                                if (state !== 0 || state !== "0") {animationsValues.skewxf = state}
                                }} 
                            skewxt={(state) => {
                                document.querySelector(':root').style.setProperty('--skewX-to', `skewX(${state + "deg"})`)
                                if (state !== 0 || state !== "0") {animationsValues.skewxt = state}
                                }}
                            skewyf={(state) => {
                                document.querySelector(':root').style.setProperty('--skewY-from', `skewY(${state + "deg"})`)
                                if (state !== 0 || state !== "0") {animationsValues.skewyf = state}
                                }}
                            skewyt={(state) => {
                                document.querySelector(':root').style.setProperty('--skewY-to', `skewY(${state + "deg"})`)
                                if (state !== 0 || state !== "0") {animationsValues.skewyt = state}
                                }}
                        />

                        <ScaleSection 
                            scalexf={(state) => {
                                document.querySelector(':root').style.setProperty('--scaleX-from', `scaleX(${state})`)
                                if (state !== 0 || state !== "0") {animationsValues.scalexf = state}
                                }} 
                            scalext={(state) => {
                                document.querySelector(':root').style.setProperty('--scaleX-to', `scaleX(${state})`)
                                if (state !== 0 || state !== "0") {animationsValues.scalext = state}
                                }}
                            scaleyf={(state) => {
                                document.querySelector(':root').style.setProperty('--scaleY-from', `scaleY(${state})`)
                                if (state !== 0 || state !== "0") {animationsValues.scaleyf = state}
                                }}
                            scaleyt={(state) => {
                                document.querySelector(':root').style.setProperty('--scaleY-to', `scaleY(${state})`)
                                if (state !== 0 || state !== "0") {animationsValues.scaleyt = state}
                                }}
                        />

                        <button className="trigger-animation-btn" onClick={() => {triggerAnimation(); document.querySelector("#menu__toggle").checked = false}}>Play<span>
                                <svg className="svg-icon-play" viewBox="0 0 20 20">
                                    <path className="path-icon-play" fill="none" d="M11.611,10.049l-4.76-4.873c-0.303-0.31-0.297-0.804,0.012-1.105c0.309-0.304,0.803-0.293,1.105,0.012l5.306,5.433c0.304,0.31,0.296,0.805-0.012,1.105L7.83,15.928c-0.152,0.148-0.35,0.223-0.547,0.223c-0.203,0-0.406-0.08-0.559-0.236c-0.303-0.309-0.295-0.803,0.012-1.104L11.611,10.049z"></path>
                                </svg>
                            </span>
                        </button>
                    </div>
                </li>
            </ul>
        </div>
        </>
    )
}