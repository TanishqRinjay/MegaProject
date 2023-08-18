const Category = require("../models/Categories");
const Course = require("../models/Course");
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

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
        ).populate("courses");
        return res.status(200).json({
            success: true,
            message: "All categories retreived successfully",
            data: allCategories,
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
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: "ratingAndReviews",
                populate: "instructor",

            })
            .exec();

        //Validation
        if (!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "Category data not found",
            });
        }

        // Handle the case when there are no courses
        if (selectedCategory.courses.length === 0) {
            console.log("No courses found for the selected category.");
            return res.status(404).json({
                success: false,
                message: "No courses found for the selected category.",
            });
        }

        //get courses from different categories
        
        const categoriesExceptSelected = await Category.find({
            _id: { $ne: categoryId },
        });
        let differentCategory = await Category.findOne(
            categoriesExceptSelected[
                getRandomInt(categoriesExceptSelected.length)
            ]?._id
            )
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: "instructor"
            })
            .exec();
            console.log("Error: ", categoriesExceptSelected)

        //Get Top selling courses
        //TODO: Check with bhaiya, try uncommenting .sort when you make studentEnrollment
        
        const allCategories = await Category.find({})
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: {
            path: "instructor",
        },
        })
        .exec()
      const allCourses = allCategories.flatMap((category) => category.courses)
      const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)

        //Return response
        return res.status(200).json({
            success: true,
            message: "Category details retrieved successfully",
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses,
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "unable to fetch category",
            error: err.message,
        });
    }
};
