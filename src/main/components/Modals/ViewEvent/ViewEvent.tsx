
import { useDispatch } from "react-redux"
import "../ViewEvent/ViewEvent.css"
import CloseIcon from "@mui/icons-material/Close";

import useGetUser from "../../../hooks/useGetUser"
import { setModal } from "../../../store/stores/dashboard/dashboard.store"

export default function EditEvent() {

    const dispatch = useDispatch()
    const user = useGetUser()
    
    return (

        <>
        
            <div

                onClick={() => {
                    dispatch(setModal(""))
                }}

                className="modal-wrapper"
            >

                <div
                    onClick={(e) => {
                        e.stopPropagation();
                    }}

                    className="modal-container delete-modal-container"
                >

                    <header className="modal-header">

                        <CloseIcon
                            fontSize="large"
                            className="close-icon"
                            sx={{ color: "#50a2fd" }}

                            onClick={() => {
                                dispatch(setModal(""));
                            }}
                        />

                        <h2>View detailed info of Event</h2>

                    </header>

                </div>

            </div>
        
        </>

    )

}