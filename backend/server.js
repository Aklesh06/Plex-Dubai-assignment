import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import env from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

env.config({path: path.resolve(__dirname, '../.env')});

const JWT_KEY = process.env.JWT_KEY 

const app = express();
const port = process.env.PORT || 5000

app.use(bodyParser.json());
app.use(cors())

mongoose
  .connect(process.env.mongoURL)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone : { type: String, required: true },
    pan : { type: String, unique: true, required: true },
    password: { type: String, required: true },
    is_admin: { type:Boolean, default: false},
},{ timestamps: true });

const User = mongoose.model('user',userSchema)

const campaignSchema = new mongoose.Schema({
  campaignName: { type: String, required: true },
  details: { type: String, default: '' },
  pan: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  dateOfApproval: { type: Date, default: null },
  paymentDetails: 
  { amount: { type: Number, default: null },
    dueDate: { type: Date, default: null },  
    status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
  },
  uploadDate: { type: Date, required: true, default: Date.now },
},
{ timestamps: true }
);

const Campaign = mongoose.model("Campaign", campaignSchema);

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  campaign: {
    title: { type: String, required: true },
    detail: { type: String, default: '' },
    status: { type: String, enum: ['Approved', 'Rejected', 'Pending'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dateOfApproval: { type: Date, required: false },
    dateOfUpload: { type: Date, required: true },
  },
  userDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    panCardNumber: { type: String, required: true },
    paymentDetails: {
      amount: { type: Number, required: false },
      dueDate: { type: Date, required: false },
      status: { type: String, enum: ['Paid', 'Pending'], required: true },
    }
  },
  footer: {
      contactInfo: { type: String, default: 'Contact us at support@example.com' },
  },
},
{ timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);



const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, JWT_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err); 
    res.status(401).json({ message: "Invalid token" });
  }
};

app.post('/register', async (req, res) => {
    try {
      const { fname, lname, email, phone, pannum, pass } = req.body;
  
      if (!fname || !lname || !email || !phone || !pannum || !pass) {
        return res.status(400).json({ error: 'All fields are required' });
      }
  
      const existingUser = await User.findOne({ $or: [{ email }, { pannum }] });
      if (existingUser) {
        return res.status(400).json({ error: 'Email or PAN card number already exists' });
      }
  
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(pass, saltRounds);
  
      const newUser = new User({
        first_name : fname,
        last_name : lname,
        email : email,
        phone : phone,
        pan : pannum,
        password: hashedPassword,
      });
  
      await newUser.save();
  
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

app.post('/login', async(req,res) => {
    const { email , pass } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        const match = await bcrypt.compare(pass, user.password);
        
        if (!match) {
          return res.status(400).json({ error: 'Incorrect Password' });
        }

        const token = jwt.sign(
          {userId : user._id, email : user.email, pan : user.pan , fname : user.first_name},
          JWT_KEY,
          { expiresIn: '3h' }
        )
        return res.status(200).json({ message: 'Login Successful', 
          token,
          user: { 
           id:user._id,
           fname:user.first_name,
           lname:user.last_name,
           email:user.email,
           is_admin:user.is_admin,
          }
        });
      } catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
});

app.post('/forgotpass', async(req,res) => {
    const {email, pan } = req.body;

    try{
      const user = await User.findOne({ email });
      if(!user){
        return res.status(404).json({ error : 'User Not Found'})
      }

      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        return res.status(400).json({ error: `Invalid PAN Card Number: ${pan}` });
      }

      const pannum = await User.findOne({ 'pan':pan, '_id': user._id })
      if(!pannum){
        return res.status(400).json({ error : 'Pan Number is Incorrect/Do not exist' })
      }

      return res.status(200).json({ message : 'Detail Verified', user})

    }catch(error){
      console.error('Error Forgor password:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/change-pass', async(req,res) => {
    const {userId , newpass} = req.body;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newpass, saltRounds);

    try{
      const user = await User.findByIdAndUpdate(userId, { password: hashedPassword}, { new: true})

      if(!user){
        return res.status(404).json({ error : 'User Not Found'})
      }

      return res.status(200).json({ message: 'Password Change Successful'})
    }catch(error){
      console.log('Error Changing Password:',error);
      return res.status(500).json({ error: 'Internal Server Error'})
    }

});

app.get('/dashboard', authenticate, async(req,res) => {
  try {
    const userId = req.user.userId;
    const userInfo = await User.findById(userId);
    const campaigns = await Campaign.find({ userId });
    const invoices = await Invoice.find({ "campaign.userId": userId });
    res.status(200).json({userInfo, campaigns, invoices });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.get('/adminDash', authenticate, async(req,res) => {
    try{
      const userId = req.user.userId;
      const userInfo = await User.findById(userId);
      const campaign = await Campaign.find();
      res.status(200).json({userInfo, campaign });
    }catch(error){
      console.error('AdminDash data fetch error:',error)
      res.status(500).json({ message: 'Internal server error.'});
    }
});

const uploadcamp = multer({ dest: 'uploads/' });

app.post('/upload-campaign', authenticate, uploadcamp.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const requiredHeaders = ['CampaignName','PAN', 'Details', 'Status', 'DateOfApproval', 'UploadDate', 'Amount', 'DueDate', 'PaymentStatus'];
        const campaigns = [];
        const headers = [];

        const csvStream = fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('headers', (csvHeaders) => {
              headers.push(...csvHeaders);
              const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
              if (missingHeaders.length > 0) {
                  csvStream.destroy();
                  return res.status(400).json({
                      message: `Missing or invalid headers: ${missingHeaders.join(', ')}`
                  });
              }
            })
            .on('data', (row) => {
                if (!row.PAN || !row.CampaignName) {
                    return res.status(400).json({ message: 'Missing mandatory fields.' });
                }
                if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(row.PAN)) {
                    return res.status(400).json({ message: `Invalid PAN Card Number: ${row.PAN}` });
                }
                campaigns.push({
                    userId: req.user.userId,
                    campaignName: row.CampaignName,
                    pan: row.PAN,
                    details: row.Details || '',
                    status: row.Status || 'Applied'
                });
            })
            .on('end', async () => {
                await Campaign.insertMany(campaigns);
                fs.unlinkSync(filePath);
                res.status(200).json({ message: 'Campaign data uploaded successfully.' });
            });
    } catch (error) {
        console.error('CSV upload error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.patch('/edit-campaign/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedCampaign = await Campaign.findByIdAndUpdate(id, { $set: updates }, { new: true });
        if (!updatedCampaign) {
            return res.status(404).json({ message: 'Campaign not found.' });
        }
        res.status(200).json({ message: 'Campaign updated successfully.', updatedCampaign });
    } catch (error) {
        console.error('Edit campaign error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.delete('/delete-campaign/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCampaign = await Campaign.findByIdAndDelete(id);
        if (!deletedCampaign) {
            return res.status(404).json({ message: 'Campaign not found.' });
        }
        res.status(200).json({ message: 'Campaign deleted successfully.' });
    } catch (error) {
        console.error('Delete campaign error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.patch('/edit-campaignStatus/:id', authenticate, async(req,res) => {
    try{
      const { id } = req.params;
      const campstatus = req.body;
      const updateCompaignStatus = await Campaign.findByIdAndUpdate(id, campstatus, {new:true});
      if(!updateCompaignStatus){
        return res.status(404).json({ message : 'Campaign Not Found'})
      }

      res.status(200).json({ message : 'Campaign Status Upadated Successfully'})
    }catch(error){
      console.log('Error in updating the status of Campaign', error)
      res.status(500).json({ error : 'Internal Server Problem'})
    } 
});

app.get('/invoices', authenticate, async (req, res) => {
  try {
      const invoices = await Invoice.find();
      res.status(200).json({ invoices });
  } catch (error) {
      console.error('Invoice fetch error:', error);
      res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/create-invoice', authenticate,async(req,res) => {
  try{
    const { campaignId } = req.body;
    const campaign = await Campaign.findById(campaignId);
    if(!campaign){
      return res.status(404).json({ message:'Campaign Not Found' })
    }

    if(campaign.status === 'Approved'){
      return res.status(404).json({ message:'Invoice Already Created' });
    }

    const userId = campaign.userId

    const userInfo = await User.findById(userId);
    if(!userInfo){
      return res.status(404).json({ message:'User Not Found' })
    }
    const invoiceData = {
      invoiceNumber: `INV-${Date.now()}`,
      campaign:{
        title: campaign.campaignName,
        detail: campaign.details,
        status: 'Approved',
        userId: campaign.userId,
        dataOfApproval: campaign.dateOfApproval,
        dateOfUpload: campaign.uploadDate || new Date(),
      },
      userDetails:{
        name: userInfo.first_name + ' ' + userInfo.last_name,
        email: userInfo.email,
        panCardNumber: userInfo.pan,
        paymentDetails:{
          amount: campaign.paymentDetails?.amount || 0,
          dueDate: campaign.paymentDetails?.dueDate || null,
          status: campaign.paymentDetails?.status || 'Pending',
        }
      },
      footer:{
        contactInfo: 'Contact us at support@netwit.ca',
      }
    }

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    res.status(201).json({ message: 'Invoice created successfully', invoice });
  }catch(error){
    console.error('Error during creating Invoice:',error)
    res.status(500).json({ message:'Internal Server Error' })
  }
});

const uploadinvo = multer({ dest: 'uploads/' });

app.post('/upload-invoice', authenticate, uploadinvo.single('file'), async(req,res) => {
    try{
      const filepath = req.file.path;
      const requiredHeaders = ['UserEmail','PAN','CampaignName','Camp_Description','Amount','Status'];
      const headers = [];

      const invoice = [];
      let processingQueue = Promise.resolve(); 
      
      const csvStream = fs.createReadStream(filepath)
          .pipe(csvParser())
          .on('headers', (csvHeaders) => {
              headers.push(...csvHeaders);
              const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
              if (missingHeaders.length > 0) {
                  csvStream.destroy();
                  return res.status(400).json({
                      message: `Missing or invalid headers: ${missingHeaders.join(', ')}`
                  });
              }
          })
          .on('data', (row) => {
            processingQueue = processingQueue.then(async () => {
              try {
                  await processRow(row);
              } catch (err) {
                  console.error('Error processing row:', err.message);
                }
              });
            })
          .on('end', async () => {
              try {
                  await processingQueue;
                  await Invoice.insertMany(invoice);
                  fs.unlinkSync(filepath);
                  return res.status(200).json({ message: 'Invoice data uploaded successfully.' });
              } catch (error) {
                  console.error(`Error inserting invoices: ${error.message}`);
                  return res.status(500).json({ message: 'Error uploading invoice data.' });
              }
          })
          .on('error', (err) => {
              console.error('Stream error:', err);
              return res.status(500).json({ message: 'Error reading CSV file.' });
          });
      
      async function processRow(row) {

          if (!row.PAN || !row.CampaignName) {
              return;
          }
          if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(row.PAN)) {
              return;
          }
      
          try {
              const userInfo = await User.findOne({ email: row.UserEmail });
              if (!userInfo) {
                  return; 
              }
      
              const campaign = await Campaign.findOne({ campaignName: row.CampaignName, userId: userInfo._id });
              if (!campaign) {
                  return; 
              }     
              invoice.push({
                  invoiceNumber: `INV-${Date.now()}`,
                  campaign: {
                      title: row.CampaignName,
                      detail: row.Camp_Description,
                      status: campaign.status,
                      userId: campaign.userId,
                      dateOfApproval: campaign.dateOfApproval,
                      dateOfUpload: campaign.uploadDate || new Date(),
                  },
                  userDetails: {
                      name: userInfo.first_name + ' ' + userInfo.last_name,
                      email: row.UserEmail,
                      panCardNumber: row.PAN,
                      paymentDetails: {
                          amount: row.Amount || 0,
                          dueDate: campaign.paymentDetails?.dueDate || null,
                          status: row.Status || 'Pending',
                      }
                  },
                  footer: {
                      contactInfo: 'Contact us at support@netwit.ca',
                  }
              });

          } catch (error) {
              console.error(`Error processing row: ${error.message}`);
          }
      }
    } catch (error) {
              console.error('CSV upload error:', error);
              res.status(500).json({ message: 'Internal server error.' });
    }
});


  
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });