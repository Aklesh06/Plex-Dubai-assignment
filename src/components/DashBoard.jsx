import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './dashboard.css';
import Nav from "./Nav";

export default function Home() {

    const [userInfo,setUserInfo] = useState([]);
    const [campaigns,setCampaigns] = useState([]);
    const [invoices,setInvoices] = useState([]);
    const phone = String(userInfo.phone).slice(2,);
    const [approve,setApprove] = useState(0);
    const [reject,setReject] = useState(0);
    const [pending,setPending] = useState(0);
    const [dueDateArray,setDueDateArray] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading,setIsLoading] = useState(false);
    const isRender = useRef(false);
    const navigate = useNavigate();

    const token = sessionStorage.getItem("authToken")

    useEffect(() => {
        if(isRender.current){
          return;
        }
        isRender.current = true;

        const fetchData = async () => {
          setIsLoading(true)
          try {
            const response = await axios.get("https://campaign-server.onrender.com/dashboard", {
              headers: { Authorization: `Bearer ${token}` },
            });
            setIsLoading(false)
            setUserInfo(response.data.userInfo)
            setCampaigns(response.data.campaigns)
            setInvoices(response.data.invoices)
            calculateData(response.data.campaigns)
            getDueDate(response.data.invoices)
          } catch (error) {
            setIsLoading(false)
            console.error("Error fetching data:", error);
            if(!token){
                navigate("/")
            }
            setError(error.response.data.message || "Error fetching dashboard data.")
          }
        };
        fetchData();
    }, [token]);

    const handleLogout = () => {
        sessionStorage.setItem("authToken",'')
        navigate("/")
    }

    const calculateData = (campaigns) => {
      let approvedCount = 0;
      let rejectedCount = 0;
      let pendingCount = 0;
  
      campaigns.forEach((campaign) => {
        if (campaign.status === "Approved") approvedCount++;
        else if (campaign.status === "Rejected") rejectedCount++;
        else if (campaign.status === "Pending") pendingCount++;
      });
  
      setApprove(approvedCount);
      setReject(rejectedCount);
      setPending(pendingCount)
    } 

    const getDueDate = (invoices) => {
        const dates = invoices.map((invoice) => invoice.userDetails.paymentDetails.dueDate)
        setDueDateArray([...dates]);
      }


    const closestDueDate = (dueDateArr) => {
      const now = new Date(); 
      const futureDates = dueDateArr
        .map((date) => new Date(date)) 
        .filter((date) => date > now); 

    
      if (futureDates.length === 0) return null; 
    
      const nearestDate = futureDates.reduce((closest, date) =>
        date - now < closest - now ? date : closest
      );
    
      return nearestDate;
    };

    const nearestDueDate = closestDueDate(dueDateArray);

    if (error)
      return (
        <div className="error-box">
          <p className="error-message">{error}</p>
          <button className="error-button" onClick={handleLogout}>
            Go To Login Page
          </button>
        </div>
      );

    return(
        <div className="dashboard-container">
          {isLoading && <div className="loading-overlay">Loading...</div>}
          <Nav userInfo={userInfo}/>
          <div className="show-list">
            <div className="show-heading">
              About
              <div className="show-item">
                  <span className="detail"><strong>Name:</strong> {userInfo.first_name} {userInfo.last_name}</span>
                  <span className="detail"><strong>Email:</strong> {userInfo.email}</span>
                  <span className="detail"><strong>Phone Number:</strong> {phone}</span>
                  <span className="detail"><strong>PanCardNumber:</strong> {userInfo.pan}</span>
              </div>
            </div>
            <div className="show-heading">
              Campaigns
              <div className="show-item">
                  <span className="detail"><strong>Total Campaigns:</strong> {campaigns.length}</span>
                  <span className="detail"><strong>Approved:</strong> {approve}</span>
                  <span className="detail"><strong>Rejected:</strong> {reject}</span>
                  <span className="detail"><strong>Pending:</strong> {pending}</span>
              </div>
            </div>
            <div className="show-heading">
              Invoices
              <div className="show-item">
                  <span className="detail"><strong>Total Invoices:</strong> {invoices.length}</span>
                  <span className="detail"><strong>Closest DueDate:</strong> { nearestDueDate ? new Date(nearestDueDate).toLocaleDateString('en-GB') : 'No Due Dates'}</span>
              </div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
    )
}