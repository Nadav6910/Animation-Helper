import "../styles/prism.css"
import "../styles/codepreview.css"
import Prism from "prismjs"
import { useState, useEffect } from "react"

export default function CodePreview() {

    const [copyState, setCopyState] = useState("Copy Code")

    useEffect(() => {
        Prism.highlightAll()
    }, [])

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
    
    const cssCode = `p { 
        color: red;
        background-color: blue;
        opacity: 0.5
    }
    `

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