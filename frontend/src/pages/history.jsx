import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import HomeIcon from "@mui/icons-material/Home";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        // Expecting array; fallback to [] if API returns empty or shape differs
        setMeetings(Array.isArray(history) ? history : history?.data || []);
      } catch (e) {
        console.log(e);
        setMeetings([]);
      }
    };
    fetchHistory();
  }, [getHistoryOfUser]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div style={{ padding: 12 }}>
      <IconButton onClick={() => routeTo("/home")}>
        <HomeIcon />
      </IconButton>

      {meetings.length > 0 ? (
        meetings.map((e, i) => (
          <Card key={e._id || i} variant="outlined" style={{ marginBottom: 12 }}>
            <CardContent>
              <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                Code : {e.meetingCode || e.code || "-"}
              </Typography>

              <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
                Date : {formatDate(e.date)}
              </Typography>
            </CardContent>
            <hr />
            <CardContent>
              <Typography
                gutterBottom
                sx={{ color: "text.secondary", fontSize: 14 }}
              >
                Notes
              </Typography>
              <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
                —
              </Typography>
            </CardContent>
          </Card>
        ))
      ) : (
        <div>No History</div>
      )}
    </div>
  );
}
