const Locker = require("../models/Locker");
const Location = require("../models/Location");

//Create Locker - Admin

const createLocker = async (req, res) => {
  try {
    const {
      location,
      lockerNumber,
      size,
      pricePerHour,
      pricePerDay,
      description,
    } = req.body;

    if (
      !location || !lockerNumber || !size || pricePerDay === undefined || pricePerHour === undefined
    ) {
      return res.status(400).json({
        message: "Required locker fields are missing",
      });
    }

    if (!["small", "medium", "large"].includes(size)) {
      return res.status(400).json({
        message: "Invalid locker size",
      });
    }

    const hourlyPrice = Number(pricePerHour);
    const dailyPrice = Number(pricePerDay);

    if (
      !Number.isFinite(hourlyPrice) ||
      !Number.isFinite(dailyPrice) ||
      hourlyPrice < 0 ||
      dailyPrice < 0
    ) {
      return res.status(400).json({
        message: "Prices must be valid non-negative numbers",
      });
    }

    const activeLocation = await Location.findOne({
      _id: location,
      isActive: true,
    });


    if (!activeLocation) {
      return res.status(404).json({
        message: "Active location not found",
      });
    }

    const locker = await Locker.create({
      location,
      lockerNumber: lockerNumber.trim(),
      size,
      pricePerHour: hourlyPrice,
      pricePerDay: dailyPrice,
      description,
    });

    await Location.updateOne(
      { _id: location },
      { $inc: { totalLockers: 1, availableLockers: 1 } }
    );

    return res.status(201).json({
      message: "Locker created successfully",
      locker,
    });
  }

  catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Locker number already exists at this location",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid locker data",
        error: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid location Id",
      });
    }

    return res.status(500).json({
      message: "Failed to create locker",
      error: error.message,
    });
  }
};

//get All lockers - Public

const getLockers = async (req, res) => {
  try {
    const { location, size, status } = req.query;

    const filter = {
      isActive: true,
      status: "available",
      activeBooking: null,
    };

    if (status === "all") {
      delete filter.status;
      delete filter.activeBooking;
    }

    if (location) filter.location = location;
    if (size) filter.size = size;
    if (status && status !== "available" && status !== "all") filter.status = status;

    const lockers = await Locker.find(filter).
      populate("location", "name city state")
      .sort({ lockerNumber: 1 });

    return res.status(200).json({
      count: lockers.length,
      lockers,
    });
  }

  catch (error) {
    return res.status(500).json({
      message: "Failed to fetch lockers",
      error: error.message,
    });
  }
};


//get locker by id-Public
const getLockerById = async (req, res) => {
  try {
    const locker = await Locker.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("location", "name city state address");

    if (!locker) {
      return res.status(404).json({
        message: "Locker not found",
      });
    }

    return res.status(200).json({ locker });
  }

  catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid locker Id",
      });
    }

    return res.status(500).json({
      message: "Failed to fetch locker",
      error: error.message,
    });
  }
};


//Update locker - Admin

const updateLocker = async (req, res) => {
  try {
    const locker = await Locker.findById(req.params.id);

    if (!locker) {
      return res.status(400).json({
        message: "Locker not found",
      });
    }

    const previousLocationId = locker.location.toString();
    const previousActive = locker.isActive;
    const previousAvailable = locker.isActive && locker.status === "available" && !locker.activeBooking;

    const {
      location,
      lockerNumber,
      size,
      pricePerHour,
      pricePerDay,
      status,
      description,
      isActive,
    } = req.body;

    if (location !== undefined) {
      if (locker.activeBooking && location.toString() !== previousLocationId) {
        return res.status(409).json({ message: "A reserved locker cannot be moved to another location." });
      }
      const activeLocation = await Location.findOne({
        _id: location,
        isActive: true,
      });

      if (!activeLocation) {
        return res.status(404).json({
          message: "Active location not found",
        });
      }

      locker.location = location;
    }

    if (lockerNumber !== undefined) {
      locker.lockerNumber = lockerNumber;
    }

    if (size !== undefined) {
      if (!["small", "medium", "large"].includes(size)) {
        return res.status(400).json({
          message: "Invalid locker size",
        });
      }

      locker.size = size;
    }

    if (pricePerHour !== undefined) {
      const price = Number(pricePerHour);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          message: "Invlid hourly price",
        });
      }

      locker.pricePerHour = price;
    }

    if (pricePerDay !== undefined) {
      const price = Number(pricePerDay);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          message: "Invalid daily price",
        });
      }
      locker.pricePerDay = price;
    }

    if (status !== undefined) {
      if (!["available", "maintenance"].includes(status)) {
        return res.status(400).json({
          message: "Invalid locekr status",
        });
      }
      locker.status = status;
    }

    if (description !== undefined) {
      locker.description = description;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          message: "isActive must be true or false",
        });
      }
      locker.isActive = isActive;
    }

    await locker.save();

    const nextLocationId = locker.location.toString();
    const nextActive = locker.isActive;
    const nextAvailable = locker.isActive && locker.status === "available" && !locker.activeBooking;
    if (previousLocationId !== nextLocationId) {
      await Location.updateOne({ _id: previousLocationId }, { $inc: { totalLockers: -1, ...(previousAvailable ? { availableLockers: -1 } : {}) } });
      await Location.updateOne({ _id: nextLocationId }, { $inc: { totalLockers: 1, ...(nextAvailable ? { availableLockers: 1 } : {}) } });
    } else if (previousActive !== nextActive || previousAvailable !== nextAvailable) {
      const totalDelta = Number(nextActive) - Number(previousActive);
      const availableDelta = Number(nextAvailable) - Number(previousAvailable);
      await Location.updateOne({ _id: nextLocationId }, { $inc: { totalLockers: totalDelta, availableLockers: availableDelta } });
    }

    return res.status(200).json({
      message: "Locker updated Successfully",
      locker,
    });
  }

  catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Locker number already exists at this location",
      });
    }
    console.error("Update locker error:", error.stack);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid locker data",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update locker",
      error: error.message,
    });
  }
};

//Deactivate Locker - Admin

const deleteLocker = async (req, res) => {
  try {
    const locker = await Locker.findById(req.params.id);

    if (!locker) {
      return res.status(404).json({
        message: "Locker not found",
      });
    }

    locker.isActive = false;
    await locker.save();
    await Location.updateOne(
      { _id: locker.location },
      { $inc: { totalLockers: -1, ...(locker.activeBooking ? {} : { availableLockers: -1 }) } }
    );

    return res.status(200).json({
      message: "Locker deactivated successfully",
    });
  }
  catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid Locker Id",
      });
    }

    return res.status(500).json({
      message: "Failed to deactivate locker",
      error: error.message,
    });
  }
};

module.exports = {
  createLocker,
  getLockers,
  getLockerById,
  updateLocker,
  deleteLocker,
};
