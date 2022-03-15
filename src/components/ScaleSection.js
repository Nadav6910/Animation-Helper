import PlusIcon from "./plusIcon"
import MinusIcon from "./minusIcon"
import { useState } from "react"

export default function ScaleSection(props) {

    const [scaleXFrom, setScaleXFrom] = useState(0)
    const [scaleYFrom, setScaleYFrom] = useState(0)
    const [scaleXTo, setScaleXTo] = useState(0)
    const [scaleYTo, setScaleYTo] = useState(0)

    //limit number of input digits to the maxLength atrribute
    const inputHandler = (e) => {
        const { value, maxLength } = e.target;

        if (String(value).length >= maxLength) {
          e.preventDefault();
          return;
        }
      };

    const keyPressHandlerXF = (e) => {
        const { value } = e.target;

        if (value.charAt(0) === "0" && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6" || e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")) {
            setScaleXFrom(String(scaleXFrom).slice(1))
            props.scalexf(String(scaleXFrom).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value.length < 2) {
            e.preventDefault()
            setScaleXFrom(0)
            props.scalexf(0)
        }
    }

    const keyPressHandlerXT = (e) => {
        const { value } = e.target;

        if (value.charAt(0) === "0" && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6" || e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")) {
            setScaleXTo(String(scaleXTo).slice(1))
            props.scalext(String(scaleXTo).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value === "") {
            e.preventDefault()
            setScaleXTo(0)
            props.scalext(0)
        }
    }

    const keyPressHandlerYF = (e) => {
        const { value } = e.target;

        if (value.charAt(0) === "0" && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6" || e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")) {
            setScaleYFrom(String(scaleYFrom).slice(1))
            props.scaleyf(String(scaleYFrom).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value.length < 2) {
            e.preventDefault()
            setScaleYFrom(0)
            props.scaleyf(0)
        }
    }

    const keyPressHandlerYT = (e) => {
        const { value } = e.target;

        if (value.charAt(0) === "0" && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6" || e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")) {
            setScaleYTo(String(scaleYTo).slice(1))
            props.scaleyt(String(scaleYTo).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value.length < 2) {
            e.preventDefault()
            setScaleYTo(0)
            props.scaleyt(0)
        }
    }

    return (
        <div className="translate-controls-container">
                    <h4 className="info-title">Scale</h4>

                    <div className="sub-titles">
                        <h6 className="info-title">Scale-X</h6>
                        <h6 className="info-title">Scale-Y</h6>
                    </div>

                    <div className="controls-input-container">
                        <div className="X-section">

                            <div className="control-from">
                                <p className="from-text">From</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setScaleXFrom(Number(scaleXFrom) + 1); props.scalexf(Number(scaleXFrom) + 1)}}/>
                                    <input value={scaleXFrom} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setScaleXFrom(e.target.value); props.scalexf(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerXF}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setScaleXFrom(0)
                                                props.scalexf(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setScaleXFrom(Number(scaleXFrom) - 1); props.scalexf(Number(scaleXFrom) - 1)}}/>
                                </div>    
                            </div>

                            <div className="control-to">
                                <p className="to-text">To</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setScaleXTo(Number(scaleXTo) + 1); props.scalext(Number(scaleXTo) + 1)}}/>
                                    <input 
                                        value={scaleXTo} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setScaleXTo(e.target.value); props.scalext(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerXT}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setScaleXTo(0)
                                                props.scalext(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setScaleXTo(Number(scaleXTo) - 1); props.scalext(Number(scaleXTo) - 1)}}/>
                                </div>
                            </div>

                        </div>

                        <div className="Y-section">

                            <div className="control-from">
                                <p className="from-text">From</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setScaleYFrom(Number(scaleYFrom) + 1); props.scaleyf(Number(scaleYFrom) + 1)}}/>
                                    <input 
                                        value={scaleYFrom} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setScaleYFrom(e.target.value); props.scaleyf(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerYF}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setScaleYFrom(0)
                                                props.scaleyf(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setScaleYFrom(Number(scaleYFrom) - 1); props.scaleyf(Number(scaleYFrom) - 1)}}/>
                                </div>
                            </div>

                            <div className="control-to">
                                <p className="to-text">To</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setScaleYTo(Number(scaleYTo) + 1); props.scaleyt(Number(scaleYTo) + 1)}}/>
                                    <input 
                                        value={scaleYTo} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setScaleYTo(e.target.value); props.scaleyt(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerYT}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setScaleYTo(0)
                                                props.scaleyt(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setScaleYTo(Number(scaleYTo) - 1); props.scaleyt(Number(scaleYTo) - 1)}}/>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
    )
}