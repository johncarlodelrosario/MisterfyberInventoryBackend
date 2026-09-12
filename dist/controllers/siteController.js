import Site from "../models/Site";
export const createSite = async (req, res) => {
    try {
        console.log("Create site request body:", req.body);
        console.log("User from request:", req.user);
        const { name, location, description } = req.body;
        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                error: "Site name is required",
            });
        }
        if (!location) {
            return res.status(400).json({
                success: false,
                error: "Location is required",
            });
        }
        // Check if user is authenticated
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        // Check if site already exists
        const existingSite = await Site.findOne({ name });
        if (existingSite) {
            return res.status(400).json({
                success: false,
                error: "Site with this name already exists",
            });
        }
        // Create new site
        const site = new Site({
            name: name.trim(),
            location: location.trim(),
            description: description ? description.trim() : "",
            createdBy: req.user._id,
            isActive: true,
        });
        console.log("New site object:", site);
        await site.save();
        console.log("Site saved successfully");
        // Populate createdBy field
        await site.populate("createdBy", "username");
        res.status(201).json({
            success: true,
            site,
        });
    }
    catch (error) {
        console.error("Error creating site:", error);
        console.error("Error stack:", error.stack);
        // Handle validation errors
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                error: error.message,
                details: error.errors,
            });
        }
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: "Site with this name already exists",
                field: Object.keys(error.keyPattern)[0],
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || "Failed to create site",
        });
    }
};
export const getSites = async (req, res) => {
    try {
        console.log("Get sites request");
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [sites, total] = await Promise.all([
            Site.find()
                .populate("createdBy", "username")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Site.countDocuments(),
        ]);
        console.log(`Found ${sites.length} sites`);
        const response = {
            success: true,
            sites,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
        res.json(response);
    }
    catch (error) {
        console.error("Error fetching sites:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
export const getSiteById = async (req, res) => {
    try {
        const site = await Site.findById(req.params.id).populate("createdBy", "username");
        if (!site) {
            return res.status(404).json({
                success: false,
                error: "Site not found",
            });
        }
        res.json({
            success: true,
            site,
        });
    }
    catch (error) {
        console.error("Error fetching site:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
export const updateSite = async (req, res) => {
    try {
        console.log("Update site request:", req.params.id, req.body);
        const { name, location, description, isActive } = req.body;
        const site = await Site.findById(req.params.id);
        if (!site) {
            return res.status(404).json({
                success: false,
                error: "Site not found",
            });
        }
        // Check if name is being changed and if it already exists
        if (name && name !== site.name) {
            const existingSite = await Site.findOne({ name });
            if (existingSite) {
                return res.status(400).json({
                    success: false,
                    error: "Site with this name already exists",
                });
            }
        }
        site.name = name || site.name;
        site.location = location || site.location;
        site.description =
            description !== undefined ? description : site.description;
        site.isActive = isActive !== undefined ? isActive : site.isActive;
        await site.save();
        await site.populate("createdBy", "username");
        res.json({
            success: true,
            site,
        });
    }
    catch (error) {
        console.error("Error updating site:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
export const deleteSite = async (req, res) => {
    try {
        console.log("Delete site request:", req.params.id);
        const site = await Site.findById(req.params.id);
        if (!site) {
            return res.status(404).json({
                success: false,
                error: "Site not found",
            });
        }
        await site.deleteOne();
        res.json({
            success: true,
            message: "Site deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting site:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
