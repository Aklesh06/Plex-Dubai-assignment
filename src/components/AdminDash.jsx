import axios from "axios"
import { useRef, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import './admin.css';
import { setLogging } from "tesseract.js";

export default function AdminDash() {

  const [userInfo, setUserInfo] = useState([])
  const [campaigns, setCampaigns] = useState([]);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [messageCreate, setMessagerCreate] = useState('');
  const [uploadMessage,setUploadMessage] = useState('');
  const [error, setError] = useState('');
  const timeoutRef = useRef();
  const [showAlert,setShowAlert] = useState(false);
  const [currStatus, setCurrStatus] = useState('');
  const [isLoading,setIsLoading] = useState(false)
  const navigate = useNavigate();
  const token = sessionStorage.getItem("authToken");

  useEffect(() => {
    const fetchData = async () => {
           setIsLoading(true)
            try{
                const response = await axios.get('https://campaign-server.onrender.com/adminDash',{
                    headers:{Authorization: `Bearer ${token}`},
                });
                setIsLoading(false)
                setUserInfo(response.data.userInfo)
                setCampaigns(response.data.campaign)
            }catch(error){
                setIsLoading(false)
                console.error('Error Fetching Data')
                if(!token){
                    navigate('/')
                }
                setError(error.response.data.message || "Error fetching adminDash data.")
            }
    }
    fetchData();
  },[token]);

  useEffect(() => {
    if(message || uploadMessage || messageCreate){
        messageReset();
    }
    if(message && currStatus!=='Pending'){
        setShowAlert(true)
        setTimeout(() => {
            setShowAlert(false)
        },2000);
    }
    return ( () => {
        if(timeoutRef.current){
            clearTimeout(timeoutRef.current)
        }
    })
  },[message,uploadMessage,messageCreate])

  const messageReset = () => {
    console.log('clearing Message');
    if(timeoutRef.current){
        clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout( () => {
        setMessage('');
        setMessagerCreate('');
        setUploadMessage('');
    },2000);
  }

  const handleEditStatus = async(campId,newStatus) => {
    setCurrStatus(newStatus)
    setIsLoading(true)
    if(newStatus === "Approved"){

        try{
            const response = await axios.post('https://campaign-server.onrender.com/create-invoice', { campaignId : campId}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setIsLoading(false)
            setMessagerCreate('Invoice Created Successful');
        }catch(error){
            setIsLoading(false)
            console.log('Error Creating Invoice:',error);
            setMessage(error.response.data.message)
        }

    }

    try{
        const response = await axios.patch(`https://campaign-server.onrender.com/edit-campaignStatus/${campId}`, { status : newStatus} ,{
            headers:{Authorization: `Bearer ${token}`}
        });  
        setIsLoading(false)
        setCampaigns((prev) =>
            prev.map((campaign) => 
                campaign._id === campId  
                ?   { ...campaign, status: newStatus } 
                :   campaign
            )
        );
        if(newStatus !== 'Pending'){
            setMessage(`Campaign Status update to ${newStatus} Successfully`)
        }
       }catch(error){
            setIsLoading(false)
            setMessage('Error Updateing Status campaign.');
       }
    }


    const handleDownload = () => {
        if(!campaigns || campaigns.length === 0){
            alert('No campaign to download')
            return;
        }

        const header = ['CampaignName','PAN', 'Details', 'Status', 'DateOfApproval', 'UploadDate', 'Amount', 'DueDate', 'PaymentStatus'];
        const rows = campaigns.map(campaign => [
            campaign.campaignName,
            campaign.pan,
            campaign.details,
            campaign.status,
            new Date(campaign.dateOfApproval).toLocaleDateString('en-GB'),
            new Date(campaign.uploadDate).toLocaleDateString('en-GB'),
            campaign.paymentDetails.amount,
            new Date(campaign.paymentDetails.dueDate).toLocaleDateString('en-GB'),
            campaign.paymentDetails.status
        ]);


        const csvContent = [
            header.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent],{ type : 'text/csv;charset=utf-8;'});
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download','campaign.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    }

    const hadleDragOver = (event) => {
        event.preventDefault();
    }

    const handleDrop = (event) => {
        event.preventDefault()
        const droppedFile = event.dataTransfer.files[0];
        console.log('DropFile Upload')
        if(droppedFile && droppedFile.type === 'text/csv'){
            console.log('DropFile is CSV file')
            setFile(droppedFile);
        }
        else{
            setUploadMessage('Please Upload a valid CSV file')
        }

    }

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        console.log('SelectedFile Upload')
        console.log(selectedFile.type)
        if(selectedFile && selectedFile.type === 'text/csv'){
            console.log('SelectedFile is CSV file')
            setFile(selectedFile);
        }
        else{
            setUploadMessage('Please Upload a valid CSV file')
        }
    }

    const handleUpload = async () => {
        if(!file){
            setUploadMessage('Select or Drop file to upload')
            return;
        }

        const formData = new FormData();
        formData.append('file',file)

        try{
            const response = await axios.post('https://campaign-server.onrender.com/upload-invoice',formData, {
                headers :{ Authorization:`Bearer ${token}`,'Content-type': 'multipart/form-data' },
            });
            setUploadMessage(response.data.message);
        }catch(error){
            console.log(error)
            setUploadMessage(
                error.response?.data?.message || 'Error occured when uploading the file.'
            );
        }
    }

    const handleLogout = () => {
        sessionStorage.setItem("authToken",'')
        navigate("/")
    }

    if (error)
        return (
          <div className="error-box">
            <p className="error-message">{error}</p>
            <button className="error-button" onClick={handleLogout}>
              Go To Login Page
            </button>
          </div>
        );

  return (
    <>
        <div className="admin-container">
        {isLoading && <div className="loading-overlay">Loading...</div>}
        <h1 className="admin-title">Admin Dashboard</h1>
        <h2 className="welcome-message">Welcome {userInfo.first_name}</h2>
        {showAlert && (
            <div className="success-alert-overlay">
                <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    duration: 0.5,
                    scale: { type: "spring", visualDuration: 0.5, bounce: 0.6 },
                }}
                className="success-alert-box">
                    <p>{message}</p>
                </motion.div>
            </div>
        )}

        <div className="campaign-section">
            <h2 className="campaign-title">Campaign List</h2>
            <ul className="campaign-list">
            {campaigns && campaigns.length > 0 ? (
                campaigns.map(campaign => (
                <li key={campaign._id} className="campaign-item">
                    <div className="campaign-info">
                    <span className="detail"><strong>CampaignTitle:</strong> {campaign.campaignName}</span>
                    <span className="detail"><strong>PanCardNumber:</strong> {campaign.pan}</span>
                    <span className="detail"><strong>PanCardNumber:</strong> {campaign.details}</span>
                    <span className="detail"><strong>Amount:</strong> ₹{campaign.paymentDetails.amount}</span>
                    <span className="detail"><strong>DueDate:</strong> {new Date(campaign.paymentDetails.dueDate).toLocaleDateString('en-GB')}</span>
                    <span className="detail"><strong>PaymentStatus:</strong> {campaign.paymentDetails.status}</span>
                    <span className="detail"><strong>Status:</strong> {campaign.status}</span>
                    </div>

                    <div className="campaign-actions">
                    <button onClick={() => handleEditStatus(campaign._id, 'Approved')} className="approve-btn">Approve</button>
                    <button onClick={() => handleEditStatus(campaign._id, 'Rejected')} className="reject-btn">Reject</button>
                    <button onClick={() => handleEditStatus(campaign._id, 'Pending')} className="clear-btn">Clear</button>
                    </div>
                </li>
                ))
            ) : (
                <div className="no-campaigns">No Campaigns</div>
            )}
            </ul>

            <button onClick={handleDownload} className="download-csv-btn">Download CSV</button>
        </div>

        <div className="csv-upload-section">
            <h2 className="csv-upload-title">Upload CSV</h2>
            <h4 className="format-detail">CSV should content These Headers ('UserEmail','PAN','CampaignName','Camp_Description','Amount','Status') ,Only one invoice data allowed</h4>
            <div className="csv-upload-box" onDragOver={hadleDragOver} onDrop={handleDrop} onClick={() => document.getElementById('fileInput').click()}>
            {file ? <p>{file.name}</p> : <p>Drag your CSV file here or Click to upload</p>}
            </div>

            <input type="file" accept=".csv" id="fileInput" onChange={handleFileChange} className="csv-file-input" />

            <div className="upload-box">
                <div>
                    <button onClick={handleUpload} className="upload-btn">Upload</button>
                </div>
                <div>
                    {uploadMessage && <p className="upload-message">{uploadMessage}</p>}
                </div>
                
            </div>
            
        </div>

        <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>

    </>
  )
}

