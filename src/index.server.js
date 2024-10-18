const express = require("express")
const env = require('dotenv')
const mongoose = require("mongoose")
const app = express()
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require("socket.io")
const server = http.createServer(app);

env.config()
const io = socketIo(server, {
  cors: {
    origin: "https://livinsync.onrender.com",
  }
});
mongoose.connect(
  `mongodb+srv://truquest:truquest143@cluster0.hed3y9h.mongodb.net/LiveEasy?retryWrites=true&w=majority&appName=Cluster0`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)
  .then(() => {
    console.log("DataBase connected")
  })
  .catch((error) => {
    console.log("Error in connecting Database:", error);
  })

const SuperAdminAuthenticationRoutes = require('./routes/Authentication/SuperAdmin');
const SocietySignupAuthenticationRoutes = require('./routes/Authentication/SocietyAdmin');
const SecuritySignupAuthenticationRoutes = require('./routes/Authentication/Security');

const advertisementRoutes = require('./routes/Advertisements');
const NoticeBoardRoutes = require('./routes/NoticeBoard');
const PollsRoutes = require('./routes/Polls');
const EventsRoutes = require('./routes/Events');
const QRCodeRoutes = require('./routes/QrCode');
const VisitorRoutes = require('./routes/Visitors');
const VisitorServicesRoutes = require('./routes/VisitorServices');
const superAdminPaymentsRoutes = require('./routes/Superadmin/PaymentHistory');

const userProfileRoutes = require('./routes/UserProfile');
const FlatOwnerRoutes = require('./routes/FlatOwner');
const DocumentsRoutes = require('./routes/Documents');
const ServicesRoutes = require('./routes/Services');
const CommityMembersRoutes = require('./routes/CommityMembers');
const AmentitiesRoute = require('./routes/Amenities')
const AssetsRoute = require('./routes/Asset')
const SocietyIncome = require('./routes/SocietyIncome')
const SocietyBills = require('./routes/SocietyBills')
const InventoryRoute = require('./routes/Inventory');
const MaintananceRoute = require('./routes/MaintainanceRecord');
const CitiesRoute = require('./routes/Superadmin/Cities');
const ComplaintsRoute = require("./routes/Complaints")
const EmergencyContactRoute = require("./routes/EmergencyContacts");
const Polls = require("./models/Polls");
const FeaturesRoute = require("./routes/Features");
const PlansRoute = require("./routes/Plans");
const DemoRoute = require("./routes/Demo");
const NotificationRoute = require("./routes/Notifications");
const adminNotificationRoute = require("./routes/AdminNotification")
const { IndividualChat, GroupChat } = require("./models/Message");
const notifyModel = require("./models/Notifications");
const MarketPlaceRoute = require("./routes/MarketPlace")
const UPIRoute = require("./routes/UPI")

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/publicQRcodes', express.static(path.join(__dirname, 'QrScanner')));
app.use('/publicServices', express.static(path.join(__dirname, 'ServicesPictures')));
app.use('/ServicesPictures', express.static(path.join(__dirname, 'ServicesPictures')));
app.use('/publicQRServicesPictures', express.static(path.join(__dirname, 'ServicesPictures')));

app.use('/publicAssets', express.static(path.join(__dirname, 'Uploads/Assets')));
app.use('/publicSecurityPictures', express.static(path.join(__dirname, 'Uploads/SequrityProfile')));
app.use('/publicSocietyImages', express.static(path.join(__dirname, 'Uploads/SocietyProfile')));
app.use('/publicSocietyDocuments', express.static(path.join(__dirname, 'Uploads/SocietyProfile')));
app.use('/publicPictures', express.static(path.join(__dirname, 'Uploads/Advertisements')));
app.use('/publicEvents', express.static(path.join(__dirname, 'Uploads/Events')));
app.use('/publicUser', express.static(path.join(__dirname, 'Uploads/UserProfile')));
app.use('/publicQRVisitorsPictures', express.static(path.join(__dirname, 'Uploads/VisitorsPictures')));
app.use('/publicVisitorsPictures', express.static(path.join(__dirname, 'Uploads/VisitorsPictures')));
app.use('/publicCities', express.static(path.join(__dirname, 'Uploads/Cities')));
app.use('/publicServicesPictures', express.static(path.join(__dirname, 'Uploads/ServicesPictures')));
app.use('/publicQRServicesPictures', express.static(path.join(__dirname, 'Uploads/ServicesPictures')));
app.use('/publicCommityPictures', express.static(path.join(__dirname, 'Uploads/CommityMembers')));
app.use('/publicDocuments', express.static(path.join(__dirname, 'Uploads/Documents')));
app.use('/publicSocietyBills', express.static(path.join(__dirname, 'Uploads/SocietyBills')));
app.use('/publicAmenity', express.static(path.join(__dirname, 'Uploads/Amenity')));
app.use('/publicMaintainance', express.static(path.join(__dirname, 'Uploads/Maintainance')));

app.use('/api', SuperAdminAuthenticationRoutes);
app.use('/api', SocietySignupAuthenticationRoutes);
app.use('/api', SecuritySignupAuthenticationRoutes);

app.use('/api', advertisementRoutes);
app.use('/api', NoticeBoardRoutes);
app.use('/api', PollsRoutes);
// app.use('/api', EventsRoutes);
app.use('/api', QRCodeRoutes);
app.use('/api', userProfileRoutes);
app.use('/api', ServicesRoutes);
app.use('/api', AmentitiesRoute);
app.use('/api', InventoryRoute);
app.use("/api", EmergencyContactRoute);
app.use('/api', VisitorRoutes);
app.use('/api', VisitorServicesRoutes);
app.use('/api', CitiesRoute);
app.use('/api', superAdminPaymentsRoutes);
app.use('/api', FeaturesRoute);
app.use('/api', PlansRoute);
app.use('/api', DemoRoute);
app.use('/api', NotificationRoute);
app.use('/api', AssetsRoute);
app.use('/api', CommityMembersRoutes);
app.use('/api', ComplaintsRoute);
app.use('/api', DocumentsRoutes);
app.use('/api', SocietyIncome);
app.use('/api', SocietyBills);
app.use('/api', MaintananceRoute);
app.use('/api', FlatOwnerRoutes);
app.use('/api', adminNotificationRoute);
app.use('/api', MarketPlaceRoute);
app.use('/api', UPIRoute);
app.use('/api/events', EventsRoutes(io));

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('join_Individual', async (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined chatroom ${conversationId}`);
    try {
      let individualChat = await IndividualChat.findOne({ conversationId });
      if (individualChat) {
        io.to(socket.id).emit("previous_individual_messages", individualChat.messages);
      }
    } catch (error) {
      console.error("Error fetching previous messages:", error);
    }
  });
  socket.on('leave_Individual', (conversationId) => {
    socket.leave(conversationId);
    console.log(`User leave chatroom ${conversationId}`);
  });

  socket.on("get_society_individual_chat_list", async (data, callback) => {
    try {
      const chatList = await IndividualChat.find({ participants: { $in: [data.societyId] } })
        .populate('participants')
        .populate('messages.sender')
        .exec();
      socket.emit('chat_list_Society', chatList);
      if (callback) callback(null, chatList);
    } catch (error) {
      console.error('Error fetching chat list:', error);
      if (callback) callback(error);
    }
  });


  socket.on('get_resident_individual_chat_list', async (data, callback) => {
    console.log(data, "societyid")
    try {
      const chatList = await IndividualChat.find({
        participants: { $in: [data.id] }
      })
        .populate('participants')
        .populate('messages.sender')
        .exec();
      socket.emit('chat_list_Residents', chatList);
    } catch (error) {
      console.error('Error fetching chat list:', error);
      // Emit the error back to the client
      socket.emit('error', { message: 'Error fetching chat list' });
    }
  });
  socket.on('send_individual_message', async (data) => {
    const { conversationId, societyId, senderId, receiverId, content, createdAt } = data;
    try {
      // Find the chat conversation by ID
      let chat = await IndividualChat.findOne({ _id: conversationId });
      // If no chat exists, create a new one
      if (!chat) {
        chat = new IndividualChat({
          societyId: societyId, // Adjust this to match your schema
          participants: [senderId, receiverId], // Include both sender and receiver
          messages: [{ sender: senderId, content, createdAt }], // Add the initial message
        });
      } else {
        // Check if the participants array contains both the sender and receiver
        if (!chat.participants.includes(senderId)) {
          chat.participants.push(senderId);
        }
        if (!chat.participants.includes(receiverId)) {
          chat.participants.push(receiverId);
        }
        // Add the new message to the existing conversation
        chat.messages.push({ sender: senderId, content, createdAt });
      }
      // Save the chat conversation
      await chat.save();
      // Emit the new message to the participants
      io.to(conversationId).emit('received_individual_message', {
        senderId,
        content,
        createdAt,
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('getindividualChatHistory', async (groupId) => {
    try {
      const individualChat = await IndividualChat.findById(groupId).populate('messages.sender', 'name'); // Populate sender details if needed
      if (individualChat) {
        socket.emit('chatHistory', individualChat.messages);
      } else {
        socket.emit('chatHistory', []); // Send an empty array if no messages found
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      socket.emit('chatHistoryError', 'Failed to fetch chat history');
    }
  });



  //Poll
  // create polls
  socket.on('create_poll', async (data) => {
    console.log(data)
    try {
      const { poll, societyId } = data;
      const newPoll = new Polls({
        societyId,
        poll,
        blocks: poll.blocks, // Add blocks to the poll
      });
      await newPoll.save();
      // Emit to users in the specific society room
      const remainingPolls = await Polls.find();
      io.emit('pollsUpdated', remainingPolls);
      io.to(societyId).emit('newNotification', {
        type: 'poll',
        message: `New poll created: ${poll.question}`,
        poll: newPoll,
      });
      if (newPoll) {
        const notifyData = new notifyModel({
          Category: "Poll",
          societyId: societyId,
          SenderName: "Society Admin",
        })
        await notifyData.save()
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      socket.emit('poll_creation_error', error.message);
    }
  });
  socket.on('get_polls_by_society_id', async (data) => {
    const { societyId } = data;
    try {
      // Fetch polls based on societyId
      let polls = await Polls.find({ societyId: societyId });
      if (!polls || polls.length === 0) {
        io.to(societyId).emit("polls_by_society_id", []);
      } else {
        const currentDate = new Date();
        // Iterate through polls to update status if expiry date has passed and status is true
        polls = await Promise.all(polls.map(async (poll) => {
          if (poll.poll.expDate < currentDate && poll.poll.status === true) {
            try {
              // Update the poll status in the database
              const updatedPoll = await Polls.findByIdAndUpdate(
                poll._id,
                { $set: { "poll.status": false } }, // Update status to false
                { new: true } // Return updated document
              );
              return updatedPoll; // Return updated poll
            } catch (err) {
              console.error("Error updating poll status:", err);
              return poll; // Return original poll if update fails
            }
          } else {
            return poll; // Return unchanged poll if conditions are not met
          }
        }));
        io.to(societyId).emit("polls_by_society_id", polls);
      }
    } catch (error) {
      console.error("Error fetching polls by society ID:", error);
      io.to(societyId).emit("polls_by_society_id_error", error.message);
    }
  });
  socket.on('vote_for__polls_by_UserID', async (data) => {
    try {
      const { userId, pollId, selectedOption } = data;
      const isValidPoll = mongoose.Types.ObjectId.isValid(pollId._id);
      console.log(isValidPoll, pollId._id, "is valid")
      if (!isValidPoll) {
        return socket.emit('vote_error', { success: false, message: "Invalid poll ID" });
      }
      const poll = await Polls.findById(pollId._id);
      if (!poll) {
        return socket.emit('vote_error', { success: false, message: "Poll not found" });
      } else {
        const existingVote = poll.poll.votes.find(vote => vote.userId === userId);;
        if (existingVote) {
          return socket.emit('vote_error', { success: false, message: "You Have Already Voted in this POLL" });
        }
      }
      const pollEndDate = new Date(poll.poll.expDate);
      const currentDate = new Date();
      if (currentDate > pollEndDate) {
        poll.poll.status = false;
        await poll.save();
        return socket.emit('vote_error', { success: false, message: "Time up for the polling." });
      } else {
        console.log('Poll is still active.');
      }
      poll.poll.votes.push({ userId, selectedOption });
      await poll.save()
      io.emit('vote_update', { pollId: pollId._id, votes: poll, message: "Successfully Voted" });
    } catch (error) {
      console.error("Error creating poll vote:", error);
      socket.emit('vote_error', { success: false, message: "Error creating poll vote", error: error.message });
    }
  });
  socket.on('deletePoll', async (pollId) => {
    try {
      // Delete the poll from the database
      const result = await Polls.findByIdAndDelete(pollId.pollId);
      // Fetch the updated list of polls
      const remainingPolls = await Polls.find(); // Adjust the query as needed
      // Notify all clients about the deletion and send the updated polls
      io.emit('pollsUpdated', remainingPolls);
    } catch (error) {
      console.error("Error deleting poll:", error);
    }
  });
  socket.on('editPoll', async (data) => {
    try {
      const { pollId, updatedPollData } = data;

      // Validate the poll ID
      const isValidPollId = mongoose.Types.ObjectId.isValid(pollId);
      if (!isValidPollId) {
        return socket.emit('edit_poll_error', { success: false, message: "Invalid poll ID" });
      }

      // Find the poll and update it
      const updatedPoll = await Polls.findByIdAndUpdate(
        pollId,
        { $set: { poll: updatedPollData } }, // Update poll with the new data
        { new: true } // Return the updated document
      );

      // Check if the poll was found and updated
      if (!updatedPoll) {
        return socket.emit('edit_poll_error', { success: false, message: "Poll not found" });
      }

      // Notify all clients about the updated poll
      const remainingPolls = await Polls.find();
      io.emit('pollsUpdated', remainingPolls);

      // Send success response back to the client
      io.to(updatedPoll.societyId).emit("polls_by_society_id", updatedPoll);
    } catch (error) {
      console.error("Error editing poll:", error);
      socket.emit('edit_poll_error', { success: false, message: "Error editing poll", error: error.message });
    }
  });



  //chat
  socket.on('createGroup', async (data) => {
    console.log(data)
    try {
      const groupChat = new GroupChat({
        groupName: data.groupName,
        societyId: data.societyId,
        members: data.members.map(member => ({ residents: member }))
      });
      const savedGroupChat = await groupChat.save();
      io.emit('groupCreated', savedGroupChat);
      io.to(SocietyId).emit('newNotification', {
        type: 'group',
        message: `New group created: ${savedGroupChat.groupName}`,
        poll: newPoll,
      });
    } catch (error) {
      console.error('Error creating group:', error);
    }
  });
  socket.on('getGroups', async ({ societyId, id }) => {
    console.log(societyId, id)
    try {
      // Fetch all groups for the given society
      const groups = await GroupChat.find({
        societyId,
      }).populate('members.residents');
      socket.emit('groupList', groups); // Send the list of groups to the requesting client
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  });
  socket.on('getGroupsForAdmin', async ({ societyId, id }) => {
    console.log(societyId)
    try {
      // Fetch all groups for the given society
      const groups = await GroupChat.find({
        societyId
      }).populate('members.residents');
      socket.emit('Admingroups', groups); // Send the list of groups to the requesting client
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  });
  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
    console.log(`Client joined group: ${groupId}`);
  });
  // Resident sending a message in a group
  socket.on('sendMessage', async (data) => {
    try {
      const groupChat = await GroupChat.findById(data.groupId);
      if (!groupChat) {
        throw new Error('Group not found');
      }
      const newMessage = {
        sender: data.senderId,
        content: data.content,
      };
      groupChat.messages.push(newMessage);
      await groupChat.save();
      // Broadcast the message to all members of the group
      io.to(data.groupId).emit('newMessage', {
        ...newMessage,
        sender: data.senderId,
        createAt: data.time
        // or any other field you want to return
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });
  socket.on('add-residents', async (data) => {
    const societyId = data.societyId;
    // Ensure residentIds is an array
    if (!Array.isArray(data.residentIds)) {
      return socket.emit('error', { message: 'residentIds should be an array' });
    }
    try {
      const newMembers = data.residentIds.map(id => ({ residents: id }));
      // Use $push with $each to add multiple residents
      await GroupChat.updateOne(
        { _id: data.groupId },
        { $push: { members: { $each: newMembers } } }
      );
      // Fetch the updated group information
      const updatedGroup = await GroupChat.find({ societyId }).populate('members.residents');
      // Emit the updated group information to the room
      io.to(societyId).emit('Admingroups', updatedGroup);
    } catch (error) {
      console.error('Error adding residents:', error);
      socket.emit('error', { message: 'Error adding residents', error });
    }
  });
  socket.on('remove-resident', async (data) => {
    const { groupId, residentId, societyId } = data;
    console.log(data)
    try {
      await GroupChat.updateOne(
        { _id: groupId },
        { $pull: { members: { residents: residentId } } }
      );
      const updatedGroup = await GroupChat.find({ societyId }).populate('members.residents');
      io.to(societyId).emit('Admingroups', updatedGroup);
    } catch (error) {
      console.error('Error removing resident:', error);
      socket.emit('error', { message: 'Error removing resident', error });
    }
  });

  socket.on('getChatHistory', async (groupId) => {
    try {
      const groupChat = await GroupChat.findById(groupId).populate('messages.sender', 'name'); // Populate sender details if needed
      if (groupChat) {
        socket.emit('chatHistory', groupChat.messages);
      } else {
        socket.emit('chatHistory', []); // Send an empty array if no messages found
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      socket.emit('chatHistoryError', 'Failed to fetch chat history');
    }
  });
  //create events\

  socket.on('create_notice', async (data) => {
    try {
      const { societyId, sender, subject, description, date } = data.formData;
      const notice = new NoticeBoard({
        societyId: societyId,
        sender: sender,
        subject: subject,
        description: description,
        date: date
      });
      await notice.save();
      // If notice is saved successfully, emit the notification to the specific society room
      io.to(societyId).emit('newNotification', {
        type: 'notice',
        message: `New Announcement: ${subject}`,
        notice: notice  // Changed from poll to notice to reflect the actual data being sent
      });
      if (notice) {
        const notifyData = new notifyModel({
          Category: "Notice",
          societyId: societyId,
          SenderName: sender,
        })
        await notifyData.save()
      }
    } catch (error) {
      console.error('Error creating notice:', error);
      // Emit an error message back to the client
      socket.emit('notice_error', 'Failed to create notice');
    }
  });
  // Notify To Gate

  socket.on('Notify-Gate', (data) => {
    console.log(data)
    io.to(data.alarmData.societyId).emit('Gate_alert_received', {
      alert: data.alarmData.option,
      block: data.alarmData.block,
      flatNumber: data.alarmData.flatNumber,
      residentName: data.alarmData.residentName,
      alertTime: new Date(), // Optional: Include the time of the alert
    });
  });

  socket.on('joinSecurityPanel', (data) => {
    console.log(data, "Security")
    socket.join(data);
  });


  socket.on("AddVisitor", (data) => {
    console.log(data)
    const sendingDate = {
      visitorName: data.data.visitorName,
      flatNumber: data.data.flatNumber,
      buildingName: data.data.buildingName,
      societyId: data.data.societyId,
      userId: data.data.userId,
      securityId: data.data.securityId,
      action: "approve or decline",
    }
    console.log(sendingDate, data.data.societyId)
    io.to(data.data.societyId).emit("Visitor_Request", sendingDate);
  });
  // Handle user response to visitor notification

  socket.on("Visitor_Response", (data) => {
    console.log("Visitor_Response", data);
    const responseMessage = {
      visitorName: data.visitorName,
      response: data.response,
      flatNumber: data.flatNumber,
      buildingName: data.buildingName,
      residentName: data.residentName,
      userId: data.userId,
      societyId: data.societyId,
      securityId: data.securityId,
      alertTime: new Date(),
    };
    // Notify security about the user's response

    io.to(data.societyId).emit(
      "Visitor_Response_Notification",
      responseMessage
    );
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server running and listening on port ${process.env.PORT || 3000}`);
});

