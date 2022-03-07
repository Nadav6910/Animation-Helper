import "../styles/sidepannel.css"

export default function SidePannel(props) {

    //send the user input text to the animation pannel and animated
    const ForwardInputText = (e) => {
        props.text(e.target.value)
    }

    return (
        <div className="side-pannel">
            <h4 className="text-input-info">Write Something To Animate</h4>
            <textarea className="animation-text-input" onChange={ForwardInputText} maxlength="100" placeholder="type here..." cols="30" rows="10"></textarea>
        </div>
    )
}