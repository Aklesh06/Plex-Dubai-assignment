import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import Nav from "./Nav";
import axios from "axios";
import './campaign.css';

export default function Campaign() {

    const [userInfo,setUserInfo] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [error, setError] = useState('');
    const [editCampId, setEditCampId] = useState(null);
    const [editCampName, setEditCampName] = useState('');
    const [editCampPan, setEditCampPan] = useState('');
    const [editCampDetail, setEditCampDetail] = useState('');
    const [editCampAmount, setEditCampAmount] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [showAlertEdit,setShowAlertEdit] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [file, setFile] = useState(null);
    const [message,setMessage] = useState('');
    const timeoutRef =useRef(null)
    const [uploadMessage,setUploadMessage] = useState('');
    const navigate = useNavigate();
    const [isLoading,setIsLoading] = useState(false);

    const token = sessionStorage.getItem("authToken")

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get("https://campaign-server.onrender.com/dashboard", {
              headers: { Authorization: `Bearer ${token}` },
            });
            setUserInfo(response.data.userInfo)
            setCampaigns(response.data.campaigns);
          } catch (error) {
            console.error("Error fetching data:", error);
            if(!token){
                navigate("/")
            }
            setError(error.response.data.message || "Error fetching campaign data.")
          }
        };
        fetchData();
    }, [token]);

    useEffect(() => {
        if (message || error || uploadMessage) {
            messagereset();
        }
        if(message){
            setShowAlertEdit(true)
            setTimeout(() => {
                setShowAlertEdit(false)
            },2000)
        }
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    },[message,error,uploadMessage])

    const messagereset = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setMessage('');
            setError('');
            setUploadMessage('');
        },3000)
    };


    const handleEdit = (camp) => {
        setEditCampId(camp._id) 
        setEditCampName(camp.campaignName)
        setEditCampPan(camp.pan)
        setEditCampDetail(camp.details)
        setEditCampAmount(camp.paymentDetails.amount)
    }

    const handleSave = async(campaignId) => {
        setSelectedCampaignId(campaignId)
        try {
            const response = await axios.patch(`https://campaign-server.onrender.com/edit-campaign/${campaignId}`, { campaignName: editCampName, pan: editCampPan, details: editCampDetail, "paymentDetails.amount": editCampAmount }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage('Campaign updated successfully.');
            setCampaigns((prev) => 
                prev.map((campaign) =>
                  campaign._id === campaignId
                    ? { ...campaign, campaignName: editCampName, pan: editCampPan, details: editCampDetail, 
                       paymentDetails: { 
                        ...campaign.paymentDetails, 
                        amount: editCampAmount
                        }
                      }
                    : campaign
                )
            );
            setEditCampId(null);
        } catch (err) {
            setMessage('Error updating campaign.');
        }
    }

    const handleCancel = () => {
        setEditCampId(null);
    }

    const handleDelete = async (campaignId) => {
        try{
            const response = await axios.delete(`https://campaign-server.onrender.com/delete-campaign/${campaignId}`, {  
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage('Campaign deleted successfully.');
            setCampaigns((prev) => 
                prev.filter((campaign) => campaign._id !== campaignId)
            );
        }catch(err){
            setMessage('Error deleting campaign.');
        }    
    }

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowAlert(true); 
    };

    const onDeleteConfirm = () => {
        handleDelete(deleteId);
        setShowAlert(false); 
        setDeleteId(null);
    }

    const onCancel = () => {
        setShowAlert(false); 
        setDeleteId(null);
    };

    // upload Csv

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
        setIsLoading(true)
        try{
            const response = await axios.post('https://campaign-server.onrender.com/upload-campaign',formData, {
                headers :{ Authorization:`Bearer ${token}`,'Content-type': 'multipart/form-data' },
            });
            setIsLoading(false)
            setUploadMessage(response.data.message);
        }catch(error){
            setIsLoading(false)
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
        <div className="campaign-page">
            {isLoading && <div className="loading-overlay">Loading...</div>}
            <Nav userInfo={userInfo} />
            <div className="campaign-section">
            <h2 className="campaign-heading">Campaigns</h2>

            <div className="csv-upload-section">
            <h2 className="upload-heading">Upload CSV</h2>
            <h4 className="format-detail">CSV should content These Headers ('CampaignName','PAN', 'Details', 'Status', 'DateOfApproval', 'UploadDate', 'Amount', 'DueDate', 'PaymentStatus') </h4>
            <div className="csv-upload-box">
                <div
                className="csv-dropzone"
                onDragOver={hadleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
                >
                {file ? <p className="file-name">{file.name}</p> : <p>Drag your CSV file here or Click to upload</p>}
                </div>
                <input type="file" accept=".csv" id="fileInput" className="file-input" onChange={handleFileChange} />
                <button className="btn-upload" onClick={handleUpload}>Upload</button>
                {uploadMessage && <p className="upload-message">{uploadMessage}</p>}
            </div>
            </div>

            <ol className="campaign-list">
                {campaigns.length !== 0 ? (
                campaigns.map((campaign) => (
                    <li key={campaign._id} className="campaign-item">
                    {editCampId === campaign._id ? (
                        <div className="campaign-edit-box">
                        <input
                            type="text"
                            className="input-edit"
                            value={editCampName}
                            onChange={(e) => setEditCampName(e.target.value)}
                            placeholder="Campaign Name"
                            required
                        />
                        <input
                            type="text"
                            className="input-edit"
                            value={editCampPan}
                            onChange={(e) => setEditCampPan(e.target.value)}
                            placeholder="PAN"
                            required
                        />
                        <textarea
                            className="textarea-edit"
                            value={editCampDetail}
                            onChange={(e) => setEditCampDetail(e.target.value)}
                            placeholder="Details"
                            required
                        />
                        <input
                            type="number"
                            className="input-edit"
                            value={editCampAmount}
                            onChange={(e) => setEditCampAmount(e.target.value)}
                            placeholder="Amount"
                            required
                        />
                        <div className="campaign-meta">
                            <span className="meta-detail">Due Date: {new Date(campaign.paymentDetails.dueDate).toLocaleDateString('en-GB')}</span>
                            <span className="meta-detail">Payment Status: {campaign.paymentDetails.status}</span>
                            <span className="meta-detail">Status: {campaign.status}</span>
                        </div>
                        <button className="btn-save" onClick={() => handleSave(campaign._id)}>Save</button>
                        <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
                        </div>
                    ) : (
                        <div className="campaign-box">
                        <div className="campaign-details">
                            <span className="detail"><strong>CampaignTitle:</strong> {campaign.campaignName}</span>
                            <span className="detail"><strong>PanCardNumber:</strong> {campaign.pan}</span>
                            <span className="detail"><strong>CampaignDetails:</strong> {campaign.details}</span>
                            <span className="detail"><strong>Amount:</strong> ₹{campaign.paymentDetails.amount}</span>
                            <span className="detail"><strong>DueDate:</strong> {new Date(campaign.paymentDetails.dueDate).toLocaleDateString('en-GB')}</span>
                            <span className="detail"><strong>PaymentStatus:</strong> {campaign.paymentDetails.status}</span>
                            <span className="detail"><strong>Status:</strong> {campaign.status}</span>
                        </div>
                        <button className="btn-edit" onClick={() => handleEdit(campaign)}>Edit</button>
                        <button className="btn-delete" onClick={() => confirmDelete(campaign._id)}>Delete</button>
                        {showAlert && deleteId === campaign._id && (
                                <div className="custom-alert-overlay">
                                    <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: 0.2,
                                        scale: { type: "spring", visualDuration: 0.2 },
                                    }}
                                    className="custom-alert-box">
                                        <p>Are you sure you want to delete this campaign?</p>
                                        <div className="alert-buttons">
                                            <button className="btn-confirm" onClick={onDeleteConfirm}>Yes</button>
                                            <button className="btn-cancel-del" onClick={onCancel}>Cancel</button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        {showAlertEdit && selectedCampaignId === campaign._id && (
                            <div className="success-alert-overlay">
                                <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    duration: 0.2,
                                    scale: { type: "spring", visualDuration: 0.5, bounce: 0.6 },
                                }} 
                                className="success-alert-box">
                                    <p>{message}</p>
                                </motion.div>
                            </div>
                        )}
                        </div>
                    )}
                    </li>
                ))
                ) : (
                <div className="no-campaign">No Campaigns</div>
                )}
            </ol>
            </div>
        
            <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
        
  )
}

