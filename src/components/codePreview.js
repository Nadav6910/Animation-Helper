import "../styles/prism.css"
import "../styles/codepreview.css"
import Prism from "prismjs"
import { useState, useEffect } from "react"

export default function CodePreview(props) {

    const [copyState, setCopyState] = useState("Copy Code")
    const [, setUpdateCode] = useState("")
    const [animationValues, setAnimationValues] = useState()

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
        if (e.target.className === "trigger-animation-btn") {
            setUpdateCode("update")
            setUpdateCode("")
        }
    } 

    const copyCode = () => {
        const code = document.querySelector("code").textContent
        navigator.clipboard.writeText(code)

        setCopyState("Coppied!")
        document.getElementById("copy-btn").style.setProperty('--text-color', "#000")
        document.getElementById("copy-btn").style.setProperty('--opacity', 1)
        document.getElementById("copy-btn").style.setProperty('---background', "transparent")

        setTimeout(() => {
            document.getElementById("copy-btn").style.setProperty('--text-color', "#fff")
            document.getElementById("copy-btn").style.setProperty('--opacity', 0)
            document.getElementById("copy-btn").style.setProperty('---background', "#111")
            setCopyState("Copy Code")
        }, 2000)
    }

    const cssCode = 
    
`p { 
    animation: play 2s ease
}

@keyframes play {
    from {
        transform: translateX(${animationValues && animationValues.translatexf}px)
    }

    to {
        
    }
}`

    return (
        <div className="code-box">
            <pre>
                <code className="language-css" data-prismjs-copy="Copy the JavaScript snippet!">
                    {cssCode}
                </code>
            </pre>
            <button id="copy-btn" className="glow-on-hover" onClick={copyCode} type="button">{copyState}</button>
        </div>
    )
}