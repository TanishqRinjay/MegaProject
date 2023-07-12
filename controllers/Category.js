const Category = require("../models/Category");

//Handler function
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        //Validation
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: "Please provide name and description",
            });
        }

        //Create a entry in DB
        const categoryDetails = await Category.create({
            name: name,
            description: description,
        });
        console.log(categoryDetails);

        //Return success response
        return res.status(200).json({
            success: true,
            message: "Category created successfully",
        });
    } catch (err) {
        console.log(err);
        return res.status(401).json({
            success: false,
            message: "Error in creating Category",
        });
    }
};

//showAllCategories

exports.showAllCategories = async (req, res) => {
    try {
        const allCategories = await Category.find(
            {},
            { name: true, description: true }
        );
        return res.status(200).json({
            success: true,
            message: "All categories retreived successfully",
            allCategories,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

exports.categoryPageDetails = async (req, res) => {
    try {
        //get CourseID
        const { categoryId } = req.body;

        //get courses for specified category ID
        const selectedCategory = await Category.findById(categoryId)
            .populate("courses")
            .exec();

        //Validation
        if (!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "Data not found",
            });
        }

        //get courses from different categories
        const differentCategories = await Category.find({
            _id: { $ne: categoryId },
        })
            .populate("courses")
            .exec();

        //Get Top selling courses
        //TODO: Check with bhaiya
        const topSellingCourses = await Course.find({})
            .sort({ $size: "studentsEnrolled" })
            .limit(10)
            .exec();

        //Return response
        return res.status(200).json({
            success: true,
            message: "Category details retrieved successfully",
            selectedCategory,
            differentCategories,
            topSellingCourses,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "unable to fetch category",
        });
    }
};
