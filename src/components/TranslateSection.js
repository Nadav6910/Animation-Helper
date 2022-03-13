import PlusIcon from "./plusIcon"
import MinusIcon from "./minusIcon"
import { useState } from "react"

export default function TranslateSection(props) {

    const [translateXFrom, setTranslateXFrom] = useState(0)
    const [translateYFrom, setTranslateYFrom] = useState(0)
    const [translateXTo, setTranslateXTo] = useState(0)
    const [translateYTo, setTranslateYTo] = useState(0)

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
            setTranslateXFrom(String(translateXFrom).slice(1))
            props.translatexf(String(translateXFrom).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value.length < 2) {
            e.preventDefault()
            setTranslateXFrom(0)
            props.translatexf(0)
        }
    }

    const keyPressHandlerXT = (e) => {
        const { value } = e.target;

        if (value.charAt(0) === "0" && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6" || e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")) {
            setTranslateXTo(String(translateXTo).slice(1))
            props.translatext(String(translateXTo).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value === "") {
            e.preventDefault()
            setTranslateXTo(0)
            props.translatext(0)
        }
    }

    const keyPressHandlerYF = (e) => {
        const { value } = e.target;

        if (value.charAt(0) === "0" && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6" || e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")) {
            setTranslateYFrom(String(translateYFrom).slice(1))
            props.translateyf(String(translateYFrom).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value.length < 2) {
            e.preventDefault()
            setTranslateYFrom(0)
            props.translateyf(0)
        }
    }

    const keyPressHandlerYT = (e) => {
        const { value } = e.target;

        if (value.charAt(0) === "0" && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6" || e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")) {
            setTranslateYTo(String(translateYTo).slice(1))
            props.translateyt(String(translateYTo).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value.length < 2) {
            e.preventDefault()
            setTranslateYTo(0)
            props.translateyt(0)
        }
    }

    return (
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
                                    <PlusIcon add={() => {setTranslateXFrom(Number(translateXFrom) + 1); props.translatexf(Number(translateXFrom) + 1)}}/>
                                    <input value={translateXFrom} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setTranslateXFrom(e.target.value); props.translatexf(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerXF}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setTranslateXFrom(0)
                                                props.translatexf(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setTranslateXFrom(Number(translateXFrom) - 1); props.translatexf(Number(translateXFrom) - 1)}}/>
                                </div>    
                            </div>

                            <div className="control-to">
                                <p className="to-text">To</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setTranslateXTo(Number(translateXTo) + 1); props.translatext(Number(translateXTo) + 1)}}/>
                                    <input 
                                        value={translateXTo} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setTranslateXTo(e.target.value); props.translatext(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerXT}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setTranslateXTo(0)
                                                props.translatext(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setTranslateXTo(Number(translateXTo) - 1); props.translatext(Number(translateXTo) - 1)}}/>
                                </div>
                            </div>

                        </div>

                        <div className="Y-section">

                            <div className="control-from">
                                <p className="from-text">From</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setTranslateYFrom(Number(translateYFrom) + 1); props.translateyf(Number(translateYFrom) + 1)}}/>
                                    <input 
                                        value={translateYFrom} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setTranslateYFrom(e.target.value); props.translateyf(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerYF}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setTranslateYFrom(0)
                                                props.translateyf(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setTranslateYFrom(Number(translateYFrom) - 1); props.translateyf(Number(translateYFrom) - 1)}}/>
                                </div>
                            </div>

                            <div className="control-to">
                                <p className="to-text">To</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setTranslateYTo(Number(translateYTo) + 1); props.translateyt(Number(translateYTo) + 1)}}/>
                                    <input 
                                        value={translateYTo} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setTranslateYTo(e.target.value); props.translateyt(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerYT}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setTranslateYTo(0)
                                                props.translateyt(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setTranslateYTo(Number(translateYTo) - 1); props.translateyt(Number(translateYTo) - 1)}}/>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
    )
}