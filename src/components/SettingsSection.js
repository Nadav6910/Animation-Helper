import { useState } from "react";

export default function SettingsSection(props) {

    const [animationDuration, setAnimationDuration] = useState(1)

    const rangeSlide = (e) => {
        document.querySelector('.rangeValue').innerHTML = e.target.value
        setAnimationDuration(e.target.value)
        props.animationDurationValue(e.target.value)
    }

    const animationRepeat = (e) => {
        props.animationRepeat(document.querySelector(`#${props.id}`).checked)
    }

    return (
        <div>
            <h4 className="info-title">Animation Settings</h4>
            <h6 className="info-title">Animation Duration</h6>
            <span className="rangeValue">{animationDuration + 's'}</span>
            <input className="range" type="range" value={animationDuration} name="" min="1" max="20" onChange={rangeSlide}></input>

            <h6 className="info-title">Animation Repeat</h6>
            <div className="toggle-container">
                <h6 className="info-title">Once</h6>
                <input type="checkbox" onChange={animationRepeat} id={props.id}/>
                <label className="animation-toggle" htmlFor={props.id}></label>
                <h6 className="info-title">Infinite</h6>
            </div>
        </div>
    )
}