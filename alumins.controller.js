


import db from "../config/database.js";
import { publicToInternalCandidates, internalToPublic } from "../utils/emailTransformer.js";
import { loginUser } from "./user.controller.js";

// ... keep your existing placement controllers (addPlacement, etc.) ...

// ✅ Controller to Add Off-Campus Alumni (POST)
const addOffCampusAluminiDetails = async (req, res) => {
    const userEmail = req.session.userEmail;
    
    // Authorization Check
    if (internalToPublic(userEmail) === "placementcell@rguktong.ac.in") {
        try {
            let { student_name, idno, hired_company, role, hired_date, graduation_year } = req.body;
            
            // Normalize Data
            student_name = student_name?.toLowerCase();
            hired_company = hired_company?.toLowerCase();
            role = role?.toLowerCase();
            idno = idno?.toLowerCase();
            // Keep stored email in one of the internal domains; use existing pattern
            const email_id = idno + "@rguktinfosinity.ac.in";

            await db.query(
                "INSERT INTO offcampusalumins (student_name, email_id, hired_company, role_name, hiring_date, graduation_year, idno) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                [student_name, email_id, hired_company, role, hired_date, graduation_year, idno]
            );

            res.json("details added sucessfully");
        } catch (error) {
            console.error(error);
            res.status(500).json("database error");
        }
    } else {
        res.status(403).json("un authorized");
    }
};

// ✅ Controller to Fetch All Alumni (GET)
const displayAlumins = async (req, res) => {
    try {
        const checkStatus = "Hired";
        const result = await db.query(`
            SELECT 
                rs.name, 
                rs.idno, 
                rs.graduation_year,
                p.company_name,
                p.role,
                p.role_description 
            FROM registered_students AS rs 
            INNER JOIN placements AS p ON rs.placement_id = p.placement_id 
            WHERE rs.status = $1
            
            UNION
            
            SELECT 
                oca.student_name AS name,
                oca.idno,
                oca.graduation_year,
                oca.hired_company AS company_name,
                oca.role_name AS role,
                NULL AS role_description
            FROM offcampusalumins AS oca
        `, [checkStatus]);

        res.json({ message: "fetched successfully", result: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json("error occurred");
    }
};

// Make sure to export these along with your other functions
export {
    addOffCampusAluminiDetails,
    displayAlumins,
    // ... export your other placement functions here ...
};