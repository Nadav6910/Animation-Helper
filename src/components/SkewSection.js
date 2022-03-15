import PlusIcon from "./plusIcon"
import MinusIcon from "./minusIcon"
import { useState } from "react"

export default function SkewSection(props) {

    const [skewXFrom, setSkewXFrom] = useState(0)
    const [skewYFrom, setSkewYFrom] = useState(0)
    const [skewXTo, setSkewXTo] = useState(0)
    const [skewYTo, setSkewYTo] = useState(0)

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
            setSkewXFrom(String(skewXFrom).slice(1))
            props.skewxf(String(skewXFrom).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value.length < 2) {
            e.preventDefault()
            setSkewXFrom(0)
            props.skewxf(0)
        }
    }

    const keyPressHandlerXT = (e) => {
        const { value } = e.target;

        if (value.charAt(0) === "0" && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6" || e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")) {
            setSkewXTo(String(skewXTo).slice(1))
            props.skewxt(String(skewXTo).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value === "") {
            e.preventDefault()
            setSkewXTo(0)
            props.skewxt(0)
        }
    }

    const keyPressHandlerYF = (e) => {
        const { value } = e.target;

        if (value.charAt(0) === "0" && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6" || e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")) {
            setSkewYFrom(String(skewYFrom).slice(1))
            props.skewyf(String(skewYFrom).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value.length < 2) {
            e.preventDefault()
            setSkewYFrom(0)
            props.skewyf(0)
        }
    }

    const keyPressHandlerYT = (e) => {
        const { value } = e.target;

        if (value.charAt(0) === "0" && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6" || e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")) {
            setSkewYTo(String(skewYTo).slice(1))
            props.skewyt(String(skewYTo).slice(1))
        }

        ["e", "E", "+"].includes(e.key) && e.preventDefault()

        if (e.key === "Backspace" && value.length < 2) {
            e.preventDefault()
            setSkewYTo(0)
            props.skewyt(0)
        }
    }

    return (
        <div className="translate-controls-container">
                    <h4 className="info-title">Skew</h4>

                    <div className="sub-titles">
                        <h6 className="info-title">Skew-X</h6>
                        <h6 className="info-title">Skew-Y</h6>
                    </div>

                    <div className="controls-input-container">
                        <div className="X-section">

                            <div className="control-from">
                                <p className="from-text">From</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setSkewXFrom(Number(skewXFrom) + 1); props.skewxf(Number(skewXFrom) + 1)}}/>
                                    <input value={skewXFrom} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setSkewXFrom(e.target.value); props.skewxf(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerXF}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setSkewXFrom(0)
                                                props.skewxf(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setSkewXFrom(Number(skewXFrom) - 1); props.skewxf(Number(skewXFrom) - 1)}}/>
                                </div>    
                            </div>

                            <div className="control-to">
                                <p className="to-text">To</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setSkewXTo(Number(skewXTo) + 1); props.skewxt(Number(skewXTo) + 1)}}/>
                                    <input 
                                        value={skewXTo} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setSkewXTo(e.target.value); props.skewxt(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerXT}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setSkewXTo(0)
                                                props.skewxt(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setSkewXTo(Number(skewXTo) - 1); props.skewxt(Number(skewXTo) - 1)}}/>
                                </div>
                            </div>

                        </div>

                        <div className="Y-section">

                            <div className="control-from">
                                <p className="from-text">From</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setSkewYFrom(Number(skewYFrom) + 1); props.skewyf(Number(skewYFrom) + 1)}}/>
                                    <input 
                                        value={skewYFrom} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setSkewYFrom(e.target.value); props.skewyf(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerYF}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setSkewYFrom(0)
                                                props.skewyf(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setSkewYFrom(Number(skewYFrom) - 1); props.skewyf(Number(skewYFrom) - 1)}}/>
                                </div>
                            </div>

                            <div className="control-to">
                                <p className="to-text">To</p>
                                <div className="input-and-btns">
                                    <PlusIcon add={() => {setSkewYTo(Number(skewYTo) + 1); props.skewyt(Number(skewYTo) + 1)}}/>
                                    <input 
                                        value={skewYTo} 
                                        type="number" 
                                        className="counter-input" 
                                        maxLength="4" 
                                        onChange={(e) => {setSkewYTo(e.target.value); props.skewyt(e.target.value)}} 
                                        onKeyPress={inputHandler} 
                                        onKeyDown={keyPressHandlerYT}
                                        onKeyUp={(e) => {
                                            if (e.key === "Backspace" && e.target.value === '') {
                                                e.preventDefault()
                                                setSkewYTo(0)
                                                props.skewyt(0)
                                            }
                                        }}
                                        />
                                    <MinusIcon minus={() => {setSkewYTo(Number(skewYTo) - 1); props.skewyt(Number(skewYTo) - 1)}}/>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
    )
}