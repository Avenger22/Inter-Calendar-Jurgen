// #region "Importing stuff"
import React, { useCallback, useEffect, useState } from "react";
import "./DashboardPage.css"

import Modal from '@mui/material/Modal';

import { useRadioGroup } from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
// import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useTheme } from '@emotion/react';

import FullCalendar, { DateSelectArg, EventClickArg } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

// import "@fullcalendar/core/main.css";
import "@fullcalendar/daygrid/main.css";
import "@fullcalendar/timegrid/main.css";

import events from "./events";

import {
    getDate
} from "./events"

import HeaderCommon from "../../main/components/Common/HeaderCommon/HeaderCommon";
import FooterCommon from "../../main/components/Common/FooterCommon/FooterCommon";

import {
    setAppointements,
    invalidateAppointements,
    setModal,
    setEventsNew,
    setDoctors,
    invalidateDoctors,
    setSelectedDoctorName,
    setSelectedDoctor,
    setSelectInfo,
    setEventClick,
    setPatients,
    setSelectedPatient,
    setSelectedPatientName
} from "../../main/store/stores/dashboard/dashboard.store"

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../main/store/redux/rootState";
import axios from "axios";
import useGetUser from "../../main/hooks/useGetUser";

import interactionPlugin from "@fullcalendar/interaction";

import TestModal from "../../main/components/Modals/TestModal"
import AddEventModal from "../../main/components/Modals/AddEvent/AppointementModal"
import { toast } from "react-toastify";

import UserModals from "../../main/components/Modals/UserModals"

import listPlugin from '@fullcalendar/list';
// #endregion


// #region "Some styling for calendar"
const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  border: '4px solid #000',
  boxShadow: 44,
  p: 8
};
// #endregion


export default function DashboardPage() {


  // #region "Redux state and hooks"
  const appointements = useSelector((state: RootState) => state.dashboard.appointements);
  const doctors = useSelector((state: RootState) => state.dashboard.doctors);
  const patients = useSelector((state: RootState) => state.dashboard.patients);

  const [selectInfo, setSelectInfo] = useState<DateSelectArg | null>(null);
  const [eventClickNew, setEventClickNew] = useState<EventClickArg | null>(null);

  let calendarRef = React.createRef();

  const selectedDoctor = useSelector((state: RootState) => state.dashboard.selectedDoctor);
  const selectedDoctorName = useSelector((state: RootState) => state.dashboard.selectedDoctorName);

  const selectedPatient = useSelector((state: RootState) => state.dashboard.selectedPatient);
  const selectedPatientName = useSelector((state: RootState) => state.dashboard.selectedPatientName);

  const eventsNew = useSelector((state: RootState) => state.dashboard.eventsNew);
  const [eventNewState, setEventNewState] = useState<any>([])
  const modal = useSelector((state: RootState) => state.dashboard.modal);

  const user = useGetUser()
  const theme = useTheme()
  const dispatch = useDispatch()
  // #endregion


  // #region "fetching stuff and helpers functions"
  async function getAppointementsFromServer() {
    let result = await (await axios.get(`/appointements`));
    dispatch(setAppointements(result.data))
  }

  async function getDoctorsFromServer() {

    let result = await (await axios.get(`/doctors`));

    dispatch(setSelectedDoctor(null))
    dispatch(setDoctors(result.data))

    for (const doctor of result.data) {


        if ( ( doctor.id === user?.id ) && user?.isDoctor) {
            dispatch(setSelectedDoctor(doctor))
        }

    }

  }

  async function getPatientsFromServer() {

    let result = await (await axios.get(`/users`));

    dispatch(setSelectedPatient(null))
    dispatch(setPatients(result.data))

    if (!user?.isDoctor) {
        dispatch(setSelectedPatient(user))
    }

  }

  useEffect(()=> {
    getAppointementsFromServer()
  }, [])

  useEffect(()=> {
    getDoctorsFromServer()
  }, [])

  useEffect(()=> {
    getPatientsFromServer()
  }, [])

  const handleOpen = () => dispatch(setModal("appoinment"));
  // #endregion


  // #region "Creating events"

    let eventGuid = 0
    
    function createEventId() {
        return String(eventGuid++)
    }

    function createEvents() {
        
        // @ts-ignore
        const acceptedAppointemets = selectedDoctor?.acceptedAppointemets

        let returnedArray: any = []

        if (selectedDoctor === null) return [] //this fixed all the bugs on error boundaries etc etc

        for (const appointement of acceptedAppointemets) {

            let color = "";

            switch (appointement.status) {

                case "approved":
                    color = "#39c32f";
                    break;

                case "cancelled":
                    color = "#d01212";
                    break;

                default:
                    color = "#fc9605";

            }

            const event = {

                id: `${appointement.id}`,
                title: appointement.title,
                start: appointement.startDate,
                end: appointement.endDate,
                allDay: false,
                backgroundColor: `${user.id === appointement.user_id ? color : "#849fb7" || user.id === appointement.doctor_id ? color : "#849fb7"}`,
                // color: "#378006",
                overlap: false,
                editable: user?.id === appointement.user_id || user?.id === appointement.doctor_id,
                className: `${
                    ( user.id !== appointement.doctor_id ) && ( user.id !== appointement.user_id) ? "others-color-events" : `${appointement.status}`
                }`

            }

            returnedArray.push(event);

        }

        return returnedArray
        
    }

    const handleEventClick = (eventClick: EventClickArg) => {

        if (!user.isDoctor) {

            if (
                user.postedAppointements.find(
                  (event: any) => event.id === Number(eventClick.event._def.publicId)
                )
              ) {
                setEventClickNew(eventClick)
                dispatch(setModal("deleteEvent"));
            }

        }

        else {

            if (
                user.acceptedAppointemets.find(
                  (event: any) => event.id === Number(eventClick.event._def.publicId)
                )
              ) {
                setEventClickNew(eventClick)
                dispatch(setModal("deleteEvent"));
            }

        }
         
    };

    const todayDate = () => {

        let today = new Date();

        let dd = String(today.getDate()).padStart(2, "0");
        let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
        let yyyy = today.getFullYear();
    
        const date = yyyy + "-" + mm + "-" + dd;

        return date;

    };

    const handleDateClick = (info: any) => {};

    // #endregion


  // #region "Event listeners for select"
    function handleOnChangeSelect(e:any) {
        dispatch(setSelectedDoctorName(e.target.value))
    }

    function handleOnChangeSelectPatient(e:any) {
        dispatch(setSelectedPatientName(e.target.value))
    }

    function handleOnChangeDoctor(e: any) {

        const newDoctors = [...doctors]
        const doctorFinal = newDoctors.find(doctor => doctor.firstName + " " + doctor.lastName === e.target.value )

        dispatch(setSelectedDoctor(doctorFinal))
        handleOnChangeSelect(e)

    }

    function handleOnChangePatient(e: any) {

        const newPatients = [...patients]
        const patientFinal = newPatients.find(pattient => pattient.firstName + " " + pattient.lastName === e.target.value )

        dispatch(setSelectedPatient(patientFinal))
        handleOnChangeSelectPatient(e)

    }

    const handleDateSelect = (selectInfo: DateSelectArg) => {

        if (!user?.isDoctor && !selectedDoctor) {
            toast.warn("Please select a doctor to choose an appointement")
        }

        else if (user?.isDoctor && !selectedPatient) {
            toast.warn("Please select a patient to choose an appointement")
        }

        else {

            //@ts-ignore
            let calendarApi = calendarRef.current.getApi();
            
            calendarApi.changeView("timeGridDay", selectInfo.startStr);

            if (!user.isDoctor) {

                if (selectInfo.view.type === "timeGridDay" && selectedDoctor ) {
                    setSelectInfo(selectInfo);
                    handleOpen()
                }

            }

            else {

                if (selectInfo.view.type === "timeGridDay" && selectedPatient) {
                    setSelectInfo(selectInfo);
                    handleOpen()
                }

            }
        
        }

    };
    // #endregion


  // #region "Returning HTML JSX"

  return (

    <>

      <HeaderCommon />

      <UserModals
        eventClickNew = {eventClickNew}
        selectInfo = {selectInfo}
      />

      <div className="header-container">

          {

            //@ts-ignore
            user?.isDoctor === false ? (
                <h3 className="dashboard-title">User Dashboard</h3>
            ): (
                <h3 className="dashboard-title">Doctor Dashboard</h3>
            )

          }

      </div>

      {
          
          !user?.isDoctor ? (

            <div className="select-doctor-wrapper">
    
                <span>Choose a doctor from our clicic for an appointement: </span>
        
                <select name="filter-by-sort" id="filter-by-sort" defaultValue={'DEFAULT'}
                    onChange={function (e: any) {
                        handleOnChangeDoctor(e)
                }}>
                    
                    <option value="DEFAULT" disabled> Select Doctor</option>
        
                    {
                    
                        doctors?.length === 0 ? (
                            <option value="Default">No Doctor to choose</option>
                        ): (
                            
                            //@ts-ignore
                            doctors?.map(doctor =>  
                                <option key={doctor.id} value = {doctor.firstName + " " + doctor.lastName}> {doctor.firstName + " " + doctor.lastName} </option>
                            )
        
                        )
        
                    }
        
                </select>
    
            </div>

          ): (

            <div className="select-doctor-wrapper">
    
                <span>Choose a patient from our clicic for an appointement: </span>
    
                <select name="filter-by-sort" id="filter-by-sort" defaultValue={'DEFAULT'}
                    onChange={function (e: any) {
                        handleOnChangePatient(e)
                }}>
                    
                    <option value="DEFAULT" disabled> Select Patient</option>
        
                    {
                    
                        doctors?.length === 0 ? (
                            <option value="Default">No Patient to choose</option>
                        ): (
                            
                            //@ts-ignore
                            patients?.map(patient =>  
                                <option key={patient.id} value = {patient.firstName + " " + patient.lastName}> {patient.firstName + " " + patient.lastName} </option>
                            )
        
                        )
        
                    }
        
                </select>
    
            </div>

        )

      }


      {

            //@ts-ignore
          user?.isDoctor === false ? (

            <div className="calendar-wrapper">

                <section className="side-bar">
                    
                    <h3 className="side-bar__title">Calendar Legenda</h3>
                    <h4 className="my-color-events">My events</h4>
                    <h4 className="others-color-events">Others Events</h4>

                    <ul className="event-list">

                        <li>

                            <h4>
                                Patient user events <span>Total: {user.postedAppointements.length}</span>
                            </h4>

                        </li>

                        <li className="event-list__item pending">

                            Pending

                            <span>

                                {
                                    user.postedAppointements.filter((event: any) =>
                                        event.status.includes("pending")
                                    ).length
                                }

                            </span>

                        </li>

                        <li className="event-list__item approved">

                            Approved

                            <span>

                                {
                                    user.postedAppointements.filter((event: any) =>
                                        event.status.includes("approved")
                                    ).length
                                }

                            </span>

                        </li>

                        <li className="event-list__item cancelled">

                            Refused

                            <span>

                                {
                                    user.postedAppointements.filter((event: any) =>
                                        event.status.includes("cancelled")
                                    ).length
                                }

                            </span>

                        </li>

                    </ul>

                </section>

                <div className="calendar">

                    <FullCalendar

                        initialView = "dayGridMonth"

                        // views: {{
                        //     listDay: 'list day' ,
                        //     listWeek: 'list week' ,
                        //     listMonth: 'list month'
                        // }},

                        headerToolbar={{
                            left: "prev,next",
                            center: "title",
                            // right: "dayGridMonth, timeGridWeek, timeGridDay, listMonth, listWeek, listDay"
                            right: "dayGridMonth, timeGridWeek, timeGridDay"
                        }}

                        plugins = {[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}

                        // nowIndicator={true}
                        displayEventEnd={true}
                        editable = {true}
                        selectable = {true}
                        selectMirror={true}
                        // droppable={true}
                        weekends={false}
                        height="auto"
                        eventTimeFormat={{
                            hour: "2-digit", //2-digit, numeric
                            minute: "2-digit", //2-digit, numeric
                            hour12: false, //true, false
                        }}
                        // selectOverlap={false}
                        slotMinTime={"08:00:00"}
                        slotMaxTime={"16:00:00"}
                        allDaySlot={false}

                        //@ts-ignore
                        ref={calendarRef}
                        dayMaxEvents={true}
                        dateClick={handleDateClick}
                        eventDurationEditable={true}
                        validRange={{ start: todayDate(), end: "2023-01-01" }}

                        selectOverlap={() => {

                            //@ts-ignore
                            let calendarApi = calendarRef.current.getApi();
                            
                            if (calendarApi.view.type === "timeGridDay") {
                              return false;
                            }

                            return true;

                        }}

                        selectAllow={(selectInfo) => {

                            let startDate = selectInfo.start;
                            let endDate = selectInfo.end;

                            endDate.setSeconds(endDate.getSeconds() - 1); // allow full day selection
                            
                            if (startDate.getDate() === endDate.getDate()) {
                                return true;
                            }

                            return false;

                        }}

                        eventClick={handleEventClick}
                        select = {handleDateSelect}
                        events = {createEvents()}

                    />

                </div>

            </div>

        ): (

            <div className="calendar-wrapper">

                <section className="side-bar">
                    
                    <h3 className="side-bar__title">Calendar Legenda</h3>

                    <ul className="event-list">

                        <li>

                            <h4>
                                Doctor events <span>Total: {selectedDoctor?.acceptedAppointemets.length}</span>
                            </h4>

                        </li>

                        <li className="event-list__item pending">

                            Pending

                            <span>

                                {
                                    selectedDoctor?.acceptedAppointemets.filter((event: any) =>
                                        event.status.includes("pending")
                                    ).length
                                }

                            </span>

                        </li>

                        <li className="event-list__item approved">

                            Approved

                            <span>

                                {
                                    selectedDoctor?.acceptedAppointemets.filter((event: any) =>
                                        event.status.includes("approved")
                                    ).length
                                }

                            </span>

                        </li>

                        <li className="event-list__item cancelled">

                            Refused

                            <span>

                                {
                                    user.acceptedAppointemets.filter((event: any) =>
                                        event.status.includes("cancelled")
                                    ).length
                                }

                            </span>

                        </li>

                        <button className="notifications" onClick={function (e) {
                            dispatch(setModal("notification"))
                        }}>
                            
                            See Notifications

                            <span>

                                {

                                    selectedDoctor?.acceptedAppointemets.filter((event: any) =>
                                        event.status.includes("pending")
                                    ).length
                                    
                                }

                            </span>

                        </button>

                    </ul>

                </section>

                <div className="calendar">

                    <FullCalendar

                        initialView = "dayGridMonth"

                        headerToolbar={{
                            left: "prev,next",
                            center: "title",
                            right: "dayGridMonth, timeGridWeek, timeGridDay"
                        }}

                        plugins = {[dayGridPlugin, timeGridPlugin, interactionPlugin]}

                        nowIndicator={true}
                        displayEventEnd={true}
                        editable = {true}
                        selectable = {true}
                        selectMirror={true}
                        // droppable={true}
                        weekends={false}
                        // selectOverlap={false}
                        //@ts-ignore
                        ref={calendarRef}
                        dayMaxEvents={true}
                        dateClick={handleDateClick}
                        eventDurationEditable={true}
                        validRange={{ start: todayDate(), end: "2023-01-01" }}
                        eventTimeFormat={{
                            hour: "2-digit", //2-digit, numeric
                            minute: "2-digit", //2-digit, numeric
                            hour12: false, //true, false
                        }}
                        slotMinTime={"08:00:00"}
                        slotMaxTime={"16:00:00"}
                        allDaySlot={false}
                        height="auto"

                        selectOverlap={() => {

                            //@ts-ignore
                            let calendarApi = calendarRef.current.getApi();
                            
                            if (calendarApi.view.type === "timeGridDay") {
                              return false;
                            }

                            return true;

                        }}

                        selectAllow={(selectInfo) => {

                            let startDate = selectInfo.start;
                            let endDate = selectInfo.end;

                            endDate.setSeconds(endDate.getSeconds() - 1); // allow full day selection
                            
                            if (startDate.getDate() === endDate.getDate()) {
                                return true;
                            }

                            return false;

                        }}

                        eventClick={handleEventClick}
                        select = {handleDateSelect}
                        events = {createEvents()}

                    />

                </div>

            </div>

        )

      }

      <FooterCommon />

    </>

  )

  // #endregion


}