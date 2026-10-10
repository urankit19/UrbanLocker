const Location = require("../models/Location");

// Create Location - Admin
const createLocation = async (req, res) => {
  try {
    const {
      name,
      type,
      address,
      city,
      state,
      country,
      pincode,
      description,
      latitude,
      longitude,
      location: geoLocation,
      image,
    } = req.body;

    // Validate required fields
    if (
      !name?.trim() ||
      !type ||
      !address?.trim() ||
      !city?.trim() ||
      !state?.trim()
    ) {
      return res.status(400).json({
        message: "Required location fields are missing",
      });
    }

    // Support both frontend formats:
    // 1. latitude and longitude
    // 2. GeoJSON location.coordinates
    let lat = latitude;
    let lng = longitude;

    if (
      geoLocation?.type === "Point" &&
      Array.isArray(geoLocation.coordinates)
    ) {
      lng ??= geoLocation.coordinates[0];
      lat ??= geoLocation.coordinates[1];
    }

    let geoCoordinates = undefined;

    const latitudeProvided = lat !== undefined && lat !== "";
    const longitudeProvided = lng !== undefined && lng !== "";

    if (latitudeProvided !== longitudeProvided) {
      return res.status(400).json({
        message: "Provide both latitude and longitude",
      });
    }

    // Coordinates are optional, but validate them if provided.
    if (latitudeProvided && longitudeProvided) {
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);

      if (
        !Number.isFinite(parsedLat) ||
        !Number.isFinite(parsedLng) ||
        parsedLat < -90 ||
        parsedLat > 90 ||
        parsedLng < -180 ||
        parsedLng > 180
      ) {
        return res.status(400).json({
          message: "Invalid latitude or longitude",
        });
      }

      // GeoJSON order: [longitude, latitude]
      geoCoordinates = {
        type: "Point",
        coordinates: [parsedLng, parsedLat],
      };
    }

    const locationData = {
      name: name.trim(),
      type,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country?.trim() || "India",
      pincode: pincode?.trim() || "",
      description: description?.trim() || "",
      image: image || "",
    };

    if (geoCoordinates) {
      locationData.location = geoCoordinates;
    }

    const location = await Location.create(locationData);

    return res.status(201).json({
      message: "Location created successfully",
      location,
    });
  } catch (error) {
    console.error("Create location error:", error);

    return res.status(500).json({
      message: "Failed to create location",
      error: error.message,
    });
  }
};

// Get All Locations
const getlocations = async (req, res) => {
  try {
    const { type, city, state, search } = req.query;

    const filter = {
      isActive: true,
    };

    if (type) {
      filter.type = type;
    }

    if (city) {
      filter.city = {
        $regex: city,
        $options: "i",
      };
    }

    if (state) {
      filter.state = {
        $regex: state,
        $options: "i",
      };
    }

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          city: {
            $regex: search,
            $options: "i",
          },
        },
        {
          state: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const locations = await Location.find(filter).sort({
      name: 1,
    });

    return res.status(200).json({
      count: locations.length,
      locations,
    });
  } catch (error) {
    console.error("Get locations error:", error);

    return res.status(500).json({
      message: "Failed to fetch locations",
      error: error.message,
    });
  }
};

// Get Location By ID
const getLocationById = async (req, res) => {
  try {
    const location = await Location.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!location) {
      return res.status(404).json({
        message: "Location not found",
      });
    }

    return res.status(200).json({
      location,
    });
  } catch (error) {
    console.error("Get location by ID error:", error);

    return res.status(500).json({
      message: "Failed to fetch location",
      error: error.message,
    });
  }
};

// Get Nearby Locations
const getNearbyLocations = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      distance = 10000,
    } = req.query;

    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude === "" ||
      longitude === ""
    ) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const maxDistance = Number(distance);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        message: "Invalid latitude or longitude",
      });
    }

    if (!Number.isFinite(maxDistance) || maxDistance <= 0) {
      return res.status(400).json({
        message: "Invalid distance",
      });
    }

    const locations = await Location.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistance,
        },
      },
    });

    return res.status(200).json({
      count: locations.length,
      locations,
    });
  } catch (error) {
    console.error("Nearby locations error:", error);

    return res.status(500).json({
      message: "Failed to find nearby locations",
      error: error.message,
    });
  }
};

// Update Location - Admin
const updatelocation = async (req, res) => {
  try {
    const {
      name,
      type,
      address,
      city,
      state,
      country,
      pincode,
      description,
      latitude,
      longitude,
      location: geoLocation,
      image,
      isActive,
    } = req.body;

    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        message: "Location not found",
      });
    }

    if (name !== undefined) location.name = name.trim();
    if (type !== undefined) location.type = type;
    if (address !== undefined) location.address = address.trim();
    if (city !== undefined) location.city = city.trim();
    if (state !== undefined) location.state = state.trim();
    if (country !== undefined) location.country = country.trim();
    if (pincode !== undefined) location.pincode = pincode.trim();
    if (description !== undefined) {
      location.description = description.trim();
    }
    if (image !== undefined) location.image = image;
    if (isActive !== undefined) location.isActive = isActive;

    // Accept either GeoJSON or separate latitude/longitude.
    let lat = latitude;
    let lng = longitude;

    if (
      geoLocation?.type === "Point" &&
      Array.isArray(geoLocation.coordinates)
    ) {
      lng ??= geoLocation.coordinates[0];
      lat ??= geoLocation.coordinates[1];
    }

    const latitudeProvided = lat !== undefined && lat !== "";
    const longitudeProvided = lng !== undefined && lng !== "";

    if (latitudeProvided !== longitudeProvided) {
      return res.status(400).json({
        message: "Provide both latitude and longitude",
      });
    }

    if (latitudeProvided && longitudeProvided) {
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);

      if (
        !Number.isFinite(parsedLat) ||
        !Number.isFinite(parsedLng) ||
        parsedLat < -90 ||
        parsedLat > 90 ||
        parsedLng < -180 ||
        parsedLng > 180
      ) {
        return res.status(400).json({
          message: "Invalid latitude or longitude",
        });
      }

      location.location = {
        type: "Point",
        coordinates: [parsedLng, parsedLat],
      };
    }

    await location.save();

    return res.status(200).json({
      message: "Location updated successfully",
      location,
    });
  } catch (error) {
    console.error("Update location error:", error);

    return res.status(500).json({
      message: "Failed to update location",
      error: error.message,
    });
  }
};

// Delete Location - Soft Delete
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        message: "Location not found",
      });
    }

    location.isActive = false;
    await location.save();

    return res.status(200).json({
      message: "Location deleted successfully",
    });
  } catch (error) {
    console.error("Delete location error:", error);

    return res.status(500).json({
      message: "Failed to delete location",
      error: error.message,
    });
  }
};

module.exports = {
  createLocation,
  getlocations,
  getLocationById,
  getNearbyLocations,
  updatelocation,
  deleteLocation,
};
