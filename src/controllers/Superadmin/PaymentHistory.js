const SuperAdminPayments = require("../../models/Superadmin/PaymentHistory")
const SocietyAdmin = require("../../models/Authentication/SocietyAdmin")

exports.GetPaymentsList = async (req, res) => {
    try {
        const getPayments = await SuperAdminPayments.find()
        res.status(201).json({ getPayments })
    } catch (error) {
        console.log(error)
        res.status(404).json({ error })
    }
}

exports.updateRenewalStatus = async (req, res) => {
    const { id } = req.body
    try {
        const payment = await SuperAdminPayments.findOne({ _id: id });

        if (!payment) {
            res.status(404).json({ message: "Payment Not Found" })
        }
        if (payment.paymentStatus === "Pending") {
            payment.paymentStatus = "Completed"
            await payment.save();
            const societyPayment = await SocietyAdmin.findByIdAndUpdate({ _id: payment.societyId }, { $set: { paymentStatus: "Completed" } }, { new: true })
            if (societyPayment) {
                const notifyData = new notifyModel({
                    Category: "Payment Approval",
                    SenderName: societyPayment.societyName,
                })
                await notifyData.save()
            }
            return res.status(200).json({ message: "Payment status updated successfully" });
        }
        else {
            return res.status(400).json({ message: "Payment is not pending" });
        }

    } catch (error) {
        res.status(404).json({ error })
    }
}