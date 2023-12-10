import { useCallback, useEffect, useRef, useState } from "react"
import Skeleton from '@mui/material/Skeleton'
import styles from "./manageRestaurants.module.css"
import Search from "./Search"
import { Box, Button, Fab, Grid, Pagination, TextField, Tooltip, Zoom } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import AlertBar from "./AlertBar";
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import AddIcon from '@mui/icons-material/Add';
import ModalBox from "./Modal"
const token = sessionStorage.getItem('authToken');




let emailIsValid = false;
function isValidEmail(email) {
    const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    if (emailRegex.test(email)) {
        emailIsValid = true;
    } else {
        emailIsValid = false;
    }
    return emailIsValid;
}

let validName = false;

function isValidName(name) {
    const nameRegex = /^[A-Za-z\s]+$/g;
    if (nameRegex.test(name)) {
        validName = true
    } else {
        validName = false;
    }
    return validName;
}

let validNumber = false;
function isValidNumber(number) {
    let nums = number.toString();
    if (nums.length === 11) {
        validNumber = true;
    } else {
        validNumber = false
    }
    console.log(nums.length)
    return validNumber;
}


function ManageRiders() {

    const [riders, setRiders] = useState([]);
    const [filteredRiders, setFilteredRiders] = useState([]); // New state for filtered users
    const itemsPerPage = 6; // Number of items to display per page
    const totalPages = Math.ceil(filteredRiders.length / itemsPerPage); // Calculate the total number of pages
    const [currentPage, setCurrentPage] = useState(1);
    const [Status, setStatus] = useState({ status: '', msg: '' });
    const [open, setOpen] = useState(false);
    const [riderAccs, setRiderAcc] = useState({ Name: '', phonenumber: 0 })
    const [show, setShow] = useState(false);
    const [next, setNext] = useState(false);
    const [loading, setLoading] = useState(true);
    const searchText = useRef();
    const startIndex = (currentPage - 1) * itemsPerPage; // Calculate the starting index for the current page
    const visibleRiders = filteredRiders.slice(startIndex, startIndex + itemsPerPage); // Get the products to display on the current page
    const [showStatus, setShowStatus] = useState(false);


    async function getDetails() {
        const res = await fetch('http://192.168.18.139:3001/admin/riders', {
            method: 'GET',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
            }
        });
        const data = await res.json();
        if (data.status === "error") {
            setStatus({ status: 'error', msg: data.message })
            setRiders([])
            setFilteredRiders([])
        } else {
            setRiders(data.data);
            setFilteredRiders(data.data);
        }
        console.log('Riders: ', data)
        setTimeout(() => {
            setLoading(false)
        }, 5000)
    }

    useEffect(() => {
        getDetails()
    }, []);

    async function searchUser() {
        const { value } = searchText.current;
        const searchValue = value.toLowerCase();

        const newArr = riders.filter((rider) => {
            const name = rider.NAME.toLowerCase();
            if (name.includes(searchValue)) {
                return rider
            }
        })
        setLoading(true)
        setFilteredRiders(newArr);
        setTimeout(() => {
            setLoading(false);
        }, 2500)

    }

    const handlePageChange = (event, value) => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setCurrentPage(value);
    };

    async function addRider() {
        setOpen(true);
    }


    function checkEverything() {
        let flag;
        flag = true;
        if (!isValidName(riderAccs.Name)) {
            flag = false;
            console.log("invalid name")
        }
        if (!isValidNumber(riderAccs.phonenumber)) {
            flag = false;
            console.log("invalid phone number")
        }


        if (flag) {
            setNext(true);
        } else {
            setNext(false);
        }
        // setStage(prev => prev + 1);
    }


    const memoizedCheckEverything = useCallback(checkEverything, [
        riderAccs
    ]);

    useEffect(() => {
        memoizedCheckEverything();
    }, [memoizedCheckEverything]);


    async function registerRider() {
        setLoading(true);
        setShowStatus(false);
        const res = await fetch('http://192.168.18.139:3001/admin/riders', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Name: riderAccs.Name,
                phone_number: riderAccs.phonenumber
            })
        })
        const data = await res.json();
        if (!data || data.status === 'error') {
            setStatus({ status: 'error', msg: data.message })
        }
        if (data.status === 'success') {
            setStatus({ status: 'success', msg: data.message })
            setRiders(data.data)
            setFilteredRiders(data.data)
        }
        setTimeout(() => {
            setLoading(false);
            setShowStatus(true);
            setTimeout(() => {
                getDetails();
                setOpen(false);
            }, 800)
        }, 2000)
        console.log(filteredRiders)
    }

    async function deleteRider(riderid) {
        setShowStatus(false);
        const res = await fetch(`http://localhost:3001/admin/riders?riderid=${riderid}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        })
        const data = await res.json();
        if (!data || data.status === 'error') {
            setStatus({ status: 'error', msg: data.message })
        }
        if (data.status === 'success') {
            setLoading(true);
            setStatus({ status: 'success', msg: data.message })
        }
        setTimeout(() => {
            setLoading(false);
            setShowStatus(true);
            getDetails()
            setTimeout(() => {
                setShowStatus(false);
            }, 1000)
        }, 2000)
        console.log(data);
    }
    return (
        <>
            {open && <ModalBox open={open} setOpen={setOpen}>
                {showStatus && <AlertBar status={Status.status} msg={Status.msg} />}
                <h2>Add Rider</h2>
                <TextField disabled={loading} color="secondary" id="filled-basic" label="Rider Name" variant="filled" value={riderAccs.Name} onChange={(e) => setRiderAcc({ ...riderAccs, Name: e.target.value })} />
                <TextField disabled={loading} color="secondary" id="filled-basic" label="Phone Number" type="number" value={riderAccs.phonenumber} onChange={(e) => setRiderAcc({ ...riderAccs, phonenumber: e.target.value })} variant="filled" />
                {next && <Button disabled={loading} color="secondary" variant="contained" onClick={registerRider}>Register Rider</Button>}
            </ModalBox>}
            <div className={styles.userContainer}>
                <Tooltip disableFocusListener placement="top" aria-label="Add Rider" title="Add Rider" >
                    <Fab onClick={addRider} color="secondary" sx={{ position: 'fixed', bottom: '40px', right: '40px' }}><TwoWheelerIcon /><AddIcon /></Fab>
                </Tooltip>
                {showStatus && <AlertBar status={Status.status} msg={Status.msg} />}
                <div className={styles.searchContainer}>
                    <Search searchText={searchText} onSearch={searchUser} startIcon={<SearchIcon />} placeholder="Search rider's name" />
                </div>
                <div className={styles.usersList}>
                    {filteredRiders.length === 0 ? <div className={styles.noRes}><p>{Status.msg}</p></div> :
                        (visibleRiders.map((rider, h) => {
                            return <>
                                {loading ? <Skeleton key={h} animation="wave" variant="rounded" sx={{ width: { md: 510, sm: 410, xs: 350 } }} height={100} /> :
                                    <Zoom in={true}>
                                        <Box key={h} sx={{ width: { md: 510, sm: 410, xs: 350 }, height: 100 }} className={styles.userBox}>
                                            <Grid container sx={{ height: '100%' }}>
                                                <Grid xs={2} height='100%' sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', lineHeight: '35px' }}>

                                                    <p style={{ fontSize: '3.1rem', opacity: '0.5', color: 'grey' }}>{rider.RIDERID}</p>
                                                    <p style={{ fontSize: '0.8rem', opacity: '0.5', color: 'grey' }}>RIDER ID</p>
                                                </Grid>
                                                <Grid xs={8} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', rowGap: '10px', fontSize: '0.9rem', lineHeight: '20px' }}>
                                                    <p>Name: {rider.NAME}</p>
                                                    <p>Ph#: {rider.PHONE_NUMBER}</p>
                                                </Grid>
                                                <Grid xs={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                                    <IconButton color="error" aria-label="delete" onClick={() => deleteRider(rider.RIDERID)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Zoom>
                                }
                            </>
                        }))}
                    <Pagination page={currentPage} count={totalPages} onChange={handlePageChange} color="secondary" />
                </div>
            </div>
        </>
    )
}

export default ManageRiders
