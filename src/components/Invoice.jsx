import axios from "axios";
import { useRef,useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import Nav from "./Nav";
import './invoice.css';

export default function Invoice() {

    const [userInfo,setUserInfo] = useState([]);
    const [invoices,setInvoices] = useState([]);
    const [filterInvoice,setFilterInvoice] = useState([])
    const [currPage, setCurrPage] = useState(1);
    const limit = 9;
    const startIndex = (currPage-1)*limit 
    const endIndex = startIndex + limit
    const pageInvoice = filterInvoice.slice(startIndex,endIndex)
    const [pan, setPan] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [message,setMessage] = useState('');
    const [error,setError] = useState('');
    const timeoutRef = useRef();
    const navigate = useNavigate();

    const token = sessionStorage.getItem("authToken");

    useEffect(() => {
        const fetchUserData = async () => {
            try{
                const response = await axios.get("http://localhost:3000/dashboard", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUserInfo(response.data.userInfo);
            }catch(error){
                console.log('Error fetching data:',error);
                if(!token){
                    navigate('/')
                }
                setMessage(error.response.data.message || 'Error fetching user data.')
            }
        }
        fetchUserData()
    },[token])

    const fetchInvoiceData = async() => {
        setLoading(true);
        setError('');
        try{
            const invoiceFetch = await axios.get("http://localhost:3000/invoices", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInvoices(invoiceFetch.data.invoices);
            setFilterInvoice(invoiceFetch.data.invoices)
        }catch(error){
            console.log('Error fetching data:',error);
            if(!token){
                navigate('/')
            }
            setError(error.response.data.message || 'Error fetching invoice data')
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoiceData();
    },[])

    useEffect(() => {
        document.getElementById('invoices-start').scrollIntoView({ behavior: 'smooth' });
    }, [currPage]);

    useEffect(() => {
        if(message || error){
            messageReset();
        }
        return ( () => {
            if(timeoutRef.current){
                clearTimeout(timeoutRef.current)
            }
        })
    },[message,error])

    const messageReset = () => {
        if(timeoutRef.current){
            clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
            setMessage('');
            setError('');
        },3000)
    }

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= filterInvoice.length) {
            setCurrPage(newPage);
        }
    };

    const handleSearch = (e) => {
        setMessage('')
        e.preventDefault();
        if(!pan && !startDate && !endDate){
            setMessage('Give Pan or Range of Date to Search Invoice');
            return;
        }
        if(pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)){
            setMessage('Enter a valid PAN number');
            return;
        }
        if(startDate && !endDate || endDate && !startDate){
            setMessage('Provide a Valid Range Of Date');
            return;
        }
        
        const formDate = startDate ? new Date(startDate) : null;
        const toDate = endDate ? new Date(endDate) : null;

        console.log(startDate,endDate);

        if(toDate < formDate){
            setMessage('Select a Valid Range');
            return;
        }

        setFilterInvoice(() => {
            return invoices.filter((invoice) => {
                    const matchPan = pan ? invoice.userDetails.panCardNumber === pan : true;

                    const invoiceDate = new Date(invoice.createdAt);
                    const matchDate = formDate && toDate ? invoiceDate >= formDate && invoiceDate <= toDate : true;
                    return matchPan && matchDate;
                })
            }
        )
    }

    const handleInvoiceDownload = (invoice) => {

        const doc = new jsPDF();

        const formattedDate = new Date(invoice.createdAt).toLocaleDateString('en-GB');
        const campaignDate = new Date(invoice.campaign.dateOfUpload).toLocaleDateString('en-GB');
        const paymentDate = new Date(invoice.userDetails.paymentDetails.dueDate).toLocaleDateString('en-GB');
      
        doc.setFontSize(14);
        doc.text('Invoice Details', 10, 10);
        doc.setFontSize(12);
        doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 10, 20);
      
        doc.setFontSize(14);
        doc.text('Campaign Details:', 10, 40);
        doc.setFontSize(12);
        doc.text(`Title: ${invoice.campaign.title}`, 20, 50);
        doc.text(`Details: ${invoice.campaign.detail}`, 20, 60);
        doc.text(`Status: ${invoice.campaign.status}`, 20, 70);
        doc.text(`User ID: ${invoice.campaign.userId}`, 20, 80);
        doc.text(`Date of Upload: ${campaignDate}`, 20, 90);
      
        doc.setFontSize(14);
        doc.text('User Details:', 10, 110);
        doc.setFontSize(12);
        doc.text(`Name: ${invoice.userDetails.name}`, 20, 120);
        doc.text(`Email: ${invoice.userDetails.email}`, 20, 130);
        doc.text(`PAN Card Number: ${invoice.userDetails.panCardNumber}`, 20, 140);
      
        doc.setFontSize(14);
        doc.text('Payment Details:', 10, 160);
        doc.setFontSize(12);
        doc.text(`Amount: ${invoice.userDetails.paymentDetails.amount}`, 20, 170);
        doc.text(`Payment Date: ${paymentDate}`, 20, 180);
        doc.text(`Status: ${invoice.userDetails.paymentDetails.status}`, 20, 190);
      
        doc.text(`Contact Info: ${invoice.footer.contactInfo}`, 10, 210);
      
        doc.text(`Created In: ${formattedDate}`, 10, 230);
      
        doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);

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
        <div className="invoice-page-container">
        <Nav userInfo={userInfo} />
        <div className="invoice-section">
            <h2 id="invoices-start" className="invoice-title">Invoices</h2>
            {message && <div className="message">{message}</div>}
            <div className="search-form-container">
            <form onSubmit={handleSearch} id="search-form" className="search-form">
                <input
                type="text"
                placeholder="Search by PAN"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                className="search-input"
                />
                <input
                type="date"
                name="startDate"
                id="startDate"
                placeholder="From"
                onChange={(e) => setStartDate(e.target.value)}
                className="date-input"
                />
                <input
                type="date"
                name="endDate"
                id="endDate"
                placeholder="To"
                onChange={(e) => setEndDate(e.target.value)}
                className="date-input"
                />
                <button type="submit" className="search-button">Search</button>
            </form>
            </div>
            {loading ? (
            <div className="loading">Loading.........</div>
            ) : error ? (
            <div className="error-message">{error}</div>
            ) : filterInvoice.length !== 0 ? (
            <>
                <ul className="invoice-list">
                {pageInvoice.map((invoice) => (
                    <li key={invoice._id} className="invoice-item">
                    <div className="invoice-box">
                        <div className="invoice-number">{invoice.invoiceNumber}</div>
                        <div className="invoice-campaign">
                        <strong>Campaign Details:</strong>
                        <div className="campaign-details">
                            <span className="detail"><b>Title:</b> {invoice.campaign.title}</span>
                            <span className="detail"><b>Detail:</b> {invoice.campaign.detail}</span>
                            <span className="detail"><b>Status:</b> {invoice.campaign.status}</span>
                            <span className="detail"><b>UserID:</b> {invoice.campaign.userId}</span>
                            <span className="detail"><b>Upload-Date</b> {new Date(invoice.campaign.dateOfUpload).toLocaleDateString('en-GB')}</span>
                        </div>
                        </div>
                        <div className="invoice-user-details">
                        <strong>User Details:</strong>
                        <div className="campaign-details">
                            <span className="detail"><b>Name:</b> {invoice.userDetails.name}</span>
                            <span className="detail"><b>Email:</b> {invoice.userDetails.email}</span>
                            <span className="detail"><b>PanCardNumber:</b> {invoice.userDetails.panCardNumber}</span>
                            <strong>Payment Details:</strong>
                            <div className="campaign-details">
                            <span className="detail"><b>Amount:</b> {invoice.userDetails.paymentDetails.amount}</span>
                            <span className="detail"><b>DueDate:</b> {new Date(invoice.userDetails.paymentDetails.dueDate).toLocaleDateString('en-GB')}</span>
                            <span className="detail"><b>Payment-Status:</b> {invoice.userDetails.paymentDetails.status}</span>
                            </div>
                        </div>
                        </div>
                        <div className="invoice-footer">
                        <strong>Footer:</strong>
                        <div>{invoice.footer.contactInfo}</div>
                        </div>
                        <div className="invoice-created-at">
                        <strong>Created In:</strong>
                        <div>{new Date(invoice.createdAt).toLocaleDateString('en-GB')}</div>
                        </div>
                        <button onClick={() => handleInvoiceDownload(invoice)} className="download-button">Download Invoice</button>
                    </div>
                    </li>
                ))}
                </ul>
                <div className="pagination">
                <button
                    onClick={() => handlePageChange(currPage - 1)}
                    disabled={currPage === 1}
                    className="pagination-button"
                >
                    Previous
                </button>
                <span className="pagination-info">
                    Page {currPage} of {Math.ceil(filterInvoice.length / limit)}
                </span>
                <button
                    onClick={() => handlePageChange(currPage + 1)}
                    disabled={currPage === Math.ceil(filterInvoice.length / limit)}
                    className="pagination-button"
                >
                    Next
                </button>
                </div>
            </>
            ) : (
            <div className="no-invoices">No Invoices</div>
            )}
        </div>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>

    )
}   

