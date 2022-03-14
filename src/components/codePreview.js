import "../styles/prism.css"
import "../styles/codepreview.css"
import Prism from "prismjs"
import { useState, useEffect } from "react"

export default function CodePreview(props) {

    const [copyState, setCopyState] = useState("Copy Code")
    const [, setAnimationValues] = useState()

    const [cssCodePreview, setCssCodePreview] = useState()

    //highlight code syntax each render
    useEffect(() => {
        Prism.highlightAll()
    })

    //get the animation values from animation pannel and set them to state
    useEffect(() => {
        props.animationsValues && setAnimationValues(props.animationsValues)
    }, [props.animationsValues])

    //detect a click on play button to update the code view
    window.onclick = e => {
        if (e.target.className === "trigger-animation-btn" || e.target.className === "svg-icon-play" || e.target.className.baseVal === "path-icon-play" || e.target.className.baseVal === "svg-icon-play" || e.target.className.baseVal === undefined) {
            setCssCodePreview(
`p { 
    animation: play 2s ease
}

@keyframes play {
    from {
        ${`transform: translateX(${props.animationsValues && props.animationsValues.translatexf}px)`}
        ${`transform: translateY(${props.animationsValues && props.animationsValues.translateyf}px)`}
    }

    to {
        ${`transform: translateX(${props.animationsValues && props.animationsValues.translatext}px)`}
        ${`transform: translateY(${props.animationsValues && props.animationsValues.translateyt}px)`}
    }
}`
            )
        }
    } 

    const copyCode = () => {
        const code = document.querySelector("code").textContent
        const copyBtn = document.getElementById("copy-btn")
        navigator.clipboard.writeText(code)

        setCopyState("Coppied!")
        copyBtn.style.setProperty('--text-color', "#000")
        copyBtn.style.setProperty('--opacity', 1)
        copyBtn.style.setProperty('---background', "transparent")

        setTimeout(() => {
            copyBtn.style.setProperty('--text-color', "#fff")
            copyBtn.style.setProperty('--opacity', 0)
            copyBtn.style.setProperty('---background', "#111")
            setCopyState("Copy Code")
        }, 2000)
    }

    return (
        <div className="code-box">
            <pre>
                <code className="language-css" data-prismjs-copy="Copy the JavaScript snippet!">
                    {cssCodePreview}
                </code>
            </pre>
            <button id="copy-btn" className="glow-on-hover" onClick={copyCode} type="button">{copyState}</button>
        </div>
    )
}