import PlusIcon from "./plusIcon"
import MinusIcon from "./minusIcon"
import { useState } from "react"

export default function RotateSection(props) {

    const [rotateXFrom, setRotateXFrom] = useState(0)
    const [rotateYFrom, setRotateYFrom] = useState(0)
    const [rotateXTo, setRotateXTo] = useState(0)
    const [rotateYTo, setRotateYTo] = useState(0)

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
            setRotateXFrom(String(rotateXFrom).slice(1))
            props.rotatexf(String(rotateXFrom).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value.length < 2) {
            e.preventDefault()
            setRotateXFrom(0)
            props.rotatexf(0)
        }
    }

    const keyPressHandlerXT = (e) => {
        const { value } = e.target;

        if (value.charAt(0) === "0" && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6" || e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")) {
            setRotateXTo(String(rotateXTo).slice(1))
            props.rotatext(String(rotateXTo).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value === "") {
            e.preventDefault()
            setRotateXTo(0)
            props.rotatext(0)
        }
    }

    const keyPressHandlerYF = (e) => {
        const { value } = e.target;

        if (value.charAt(0) === "0" && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6" || e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")) {
            setRotateYFrom(String(rotateYFrom).slice(1))
            props.rotateyf(String(rotateYFrom).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value.length < 2) {
            e.preventDefault()
            setRotateYFrom(0)
            props.rotateyf(0)
        }
    }

    const keyPressHandlerYT = (e) => {
        const { value } = e.target;

        if (value.charAt(0) === "0" && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6" || e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")) {
            setRotateYTo(String(rotateYTo).slice(1))
            props.rotateyt(String(rotateYTo).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value.length < 2) {
            e.preventDefault()
            setRotateYTo(0)
            props.rotateyt(0)
        }
    }

    return (
        <div className="translate-controls-container">
                    <h4 className="info-title">Rotate</h4>

                    <div className="sub-titles">
                        <h6 className="info-title">Rotate-X</h6>
                        <h6 className="info-title">Rotate-Y</h6>
                    </div>

                    <div className="controls-input-container">
                        <div className="X-section">

                            <div className="control-from">
                                <p className="from-text">From</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setRotateXFrom(Number(rotateXFrom) + 1); props.rotatexf(Number(rotateXFrom) + 1)}}/>
                                    <input value={rotateXFrom} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setRotateXFrom(e.target.value); props.rotatexf(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerXF}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setRotateXFrom(0)
                                                props.rotatexf(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setRotateXFrom(Number(rotateXFrom) - 1); props.rotatexf(Number(rotateXFrom) - 1)}}/>
                                </div>    
                            </div>

                            <div className="control-to">
                                <p className="to-text">To</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setRotateXTo(Number(rotateXTo) + 1); props.rotatext(Number(rotateXTo) + 1)}}/>
                                    <input 
                                        value={rotateXTo} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setRotateXTo(e.target.value); props.rotatext(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerXT}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setRotateXTo(0)
                                                props.rotatext(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setRotateXTo(Number(rotateXTo) - 1); props.rotatext(Number(rotateXTo) - 1)}}/>
                                </div>
                            </div>

                        </div>

                        <div className="Y-section">

                            <div className="control-from">
                                <p className="from-text">From</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setRotateYFrom(Number(rotateYFrom) + 1); props.rotateyf(Number(rotateYFrom) + 1)}}/>
                                    <input 
                                        value={rotateYFrom} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setRotateYFrom(e.target.value); props.rotateyf(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerYF}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setRotateYFrom(0)
                                                props.rotateyf(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setRotateYFrom(Number(rotateYFrom) - 1); props.rotateyf(Number(rotateYFrom) - 1)}}/>
                                </div>
                            </div>

                            <div className="control-to">
                                <p className="to-text">To</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setRotateYTo(Number(rotateYTo) + 1); props.rotateyt(Number(rotateYTo) + 1)}}/>
                                    <input 
                                        value={rotateYTo} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setRotateYTo(e.target.value); props.rotateyt(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerYT}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setRotateYTo(0)
                                                props.rotateyt(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setRotateYTo(Number(rotateYTo) - 1); props.rotateyt(Number(rotateYTo) - 1)}}/>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
    )
}