import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  makeStyles,
  Paper,
  Typography,
} from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useDate } from "../../hooks/useDate";
import api from "../../services/api";
import { green } from "@material-ui/core/colors";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import CancelIcon from "@material-ui/icons/Cancel";
import CircularProgress from "@material-ui/core/CircularProgress";
import ModalImageCors from "../../components/ModalImageCors";
import { GetApp } from "@material-ui/icons";
import toastError from "../../errors/toastError";
import MicRecorder from "mic-recorder-to-mp3";
import MicIcon from "@material-ui/icons/Mic";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import RecordingTimer from "../../components/MessageInputCustom/RecordingTimer";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    overflow: "hidden",
    borderRadius: 0,
    height: "100%",
    borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
  },
  messageList: {
    position: "relative",
    overflowY: "auto",
    height: "100%",
    ...theme.scrollbarStyles,
    backgroundColor: theme.palette.chatlist,
  },
  inputArea: {
    position: "relative",
    height: "auto",
  },
  input: {
    padding: "20px",
    "& textarea": {
      fontFamily: "inherit", // Ensures special characters display correctly
    },
  },
  buttonSend: {
    margin: theme.spacing(1),
  },
  boxLeft: {
    padding: "8px 12px 6px 9px",
    margin: "6px 8px 2px 8px",
    position: "relative",
    backgroundColor: "#ffffff",
    color: "#111b21",
    maxWidth: "70%",
    borderRadius: "7.5px",
    borderTopLeftRadius: "0",
    boxShadow: "0 1px 0.5px rgba(11, 20, 26, 0.13)",
    "&:before": {
      content: '""',
      position: "absolute",
      left: "-8px",
      top: "0",
      width: "0",
      height: "0",
      borderStyle: "solid",
      borderWidth: "0 8px 8px 0",
      borderColor: "transparent #ffffff transparent transparent",
    },
    fontFamily: "inherit", // Ensures special characters display correctly
  },
  boxRight: {
    padding: "8px 12px 6px 9px",
    margin: "6px 8px 2px 8px",
    position: "relative",
    backgroundColor: "#d9fdd3",
    color: "#111b21",
    textAlign: "left",
    maxWidth: "70%",
    borderRadius: "7.5px",
    borderTopRightRadius: "0",
    boxShadow: "0 1px 0.5px rgba(11, 20, 26, 0.13)",
    "&:before": {
      content: '""',
      position: "absolute",
      right: "-8px",
      top: "0",
      width: "0",
      height: "0",
      borderStyle: "solid",
      borderWidth: "0 0 8px 8px",
      borderColor: "transparent transparent transparent #d9fdd3",
    },
    fontFamily: "inherit", // Ensures special characters display correctly
  },
  consecutiveBoxLeft: {
    marginTop: "1px",
    "&:before": {
      display: "none",
    },
  },
  consecutiveBoxRight: {
    marginTop: "1px",
    "&:before": {
      display: "none",
    },
  },
  sendMessageIcons: {
    color: "grey",
  },
  uploadInput: {
    display: "none",
  },
  circleLoading: {
    color: green[500],
    opacity: "70%",
    position: "absolute",
    top: "20%",
    left: "50%",
    marginLeft: -12,
  },
  viewMediaInputWrapper: {
    display: "flex",
    padding: "10px 13px",
    position: "relative",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eee",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
  },
  downloadMedia: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "inherit",
    padding: 10,
  },
  messageMedia: {
    objectFit: "cover",
    width: 250,
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  recorderWrapper: {
    display: "flex",
    alignItems: "center",
    alignContent: "middle",
    justifyContent: "flex-end",
  },
  cancelAudioIcon: {
    color: "red",
  },
  audioLoading: {
    color: green[500],
    opacity: "70%",
  },
  sendAudioIcon: {
    color: "green",
  },
  messageText: {
    whiteSpace: "pre-wrap", // Preserves formatting and special characters
    wordBreak: "break-word", // Ensures long words/characters break properly
    fontFamily: "inherit", // Ensures consistent character display
  },
}));

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

export default function ChatMessages({
  chat,
  messages,
  handleSendMessage,
  handleLoadMore,
  scrollToBottomRef,
  pageInfo,
}) {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const { datetimeToClient } = useDate();
  const baseRef = useRef();

  const [contentMessage, setContentMessage] = useState("");
  const [medias, setMedias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);

  const scrollToBottom = () => {
    if (baseRef.current) {
      baseRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const unreadMessages = (chat) => {
    if (chat !== undefined) {
      const currentUser = chat.users.find((u) => u.userId === user.id);
      return currentUser.unreads > 0;
    }
    return 0;
  };

  useEffect(() => {
    if (unreadMessages(chat) > 0) {
      try {
        api.post(`/chats/${chat.id}/read`, { userId: user.id });
      } catch (err) {
        toastError(err);
      }
    }
    scrollToBottomRef.current = scrollToBottom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (e) => {
    const { scrollTop } = e.currentTarget;
    if (!pageInfo.hasMore || loading) return;
    if (scrollTop < 600) {
      handleLoadMore();
    }
  };

  const handleChangeMedias = (e) => {
    if (!e.target.files) {
      return;
    }
    const selectedMedias = Array.from(e.target.files);
    setMedias(selectedMedias);
  };

  const checkMessageMedia = (message) => {
    if (message.mediaType === "image") {
      return <ModalImageCors imageUrl={message.mediaPath} />;
    }
    if (message.mediaType === "audio") {
      return (
        <audio controls>
          <source src={message.mediaPath} type="audio/mp3" />
        </audio>
      );
    }
    if (message.mediaType === "video") {
      return (
        <video
          className={classes.messageMedia}
          src={message.mediaPath}
          controls
        />
      );
    } else {
      return (
        <>
          <div className={classes.downloadMedia}>
            <Button
              startIcon={<GetApp />}
              color="primary"
              variant="outlined"
              target="_blank"
              href={message.mediaPath}
            >
              Download
            </Button>
          </div>
        </>
      );
    }
  };

  const handleSendMedia = async (e) => {
    setLoading(true);
    e.preventDefault();

    const formData = new FormData();
    formData.append("fromMe", true);
    medias.forEach((media) => {
      formData.append("medias", media);
      formData.append("body", media.name);
    });

    try {
      await api.post(`/chats/${chat.id}/messages`, formData, {
        headers: {
          "Content-Type": "multipart/form-data; charset=UTF-8",
        },
      });
    } catch (err) {
      toastError(err);
    }

    setLoading(false);
    setMedias([]);
  };

  const handleStartRecording = async () => {
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await Mp3Recorder.start();
      setRecording(true);
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleUploadAudio = async () => {
    setLoading(true);
    try {
      const [, blob] = await Mp3Recorder.stop().getMp3();

      if (blob.size < 10000) {
        setLoading(false);
        setRecording(false);
        return;
      }

      const formData = new FormData();
      const filename = `audio-${new Date().getTime()}.mp3`;

      formData.append("medias", blob, filename);
      formData.append("body", filename);
      formData.append("fromMe", true);

      await api.post(`/chats/${chat.id}/messages`, formData, {
        headers: {
          "Content-Type": "multipart/form-data; charset=UTF-8",
        },
      });
    } catch (err) {
      toastError(err);
    }

    setRecording(false);
    setLoading(false);
  };

  const handleCancelAudio = async () => {
    try {
      await Mp3Recorder.stop().getMp3();
      setRecording(false);
    } catch (err) {
      toastError(err);
    }
  };

  // Function to safely render text with special characters
  const renderMessageText = (text) => {
    return (
      <Typography className={classes.messageText}>
        {text}
      </Typography>
    );
  };

  return (
    <Paper className={classes.mainContainer}>
      <div onScroll={handleScroll} className={classes.messageList}>
        {Array.isArray(messages) &&
          messages.map((item, key) => {
            const isConsecutive = key > 0 && messages[key - 1].senderId === item.senderId;
            const boxClass = item.senderId === user.id 
              ? `${classes.boxRight} ${isConsecutive ? classes.consecutiveBoxRight : ""}`
              : `${classes.boxLeft} ${isConsecutive ? classes.consecutiveBoxLeft : ""}`;

            return (
              <Box key={key} className={boxClass}>
                {!isConsecutive && (
                  <Typography variant="subtitle2">
                    {item.sender.name}
                  </Typography>
                )}
                {item.mediaPath && checkMessageMedia(item)}
                {item.message && renderMessageText(item.message)}
                <Typography variant="caption" display="block">
                  {datetimeToClient(item.createdAt)}
                </Typography>
              </Box>
            );
          })}
        <div ref={baseRef}></div>
      </div>
      <div className={classes.inputArea}>
        <FormControl variant="outlined" fullWidth>
          {recording ? (
            <div className={classes.recorderWrapper}>
              <IconButton
                aria-label="cancelRecording"
                component="span"
                fontSize="large"
                disabled={loading}
                onClick={handleCancelAudio}
              >
                <HighlightOffIcon className={classes.cancelAudioIcon} />
              </IconButton>
              {loading ? (
                <div>
                  <CircularProgress className={classes.audioLoading} />
                </div>
              ) : (
                <RecordingTimer />
              )}
              <IconButton
                aria-label="sendRecordedAudio"
                component="span"
                onClick={handleUploadAudio}
                disabled={loading}
              >
                <CheckCircleOutlineIcon className={classes.sendAudioIcon} />
              </IconButton>
            </div>
          ) : (
            <>
              {medias.length > 0 ? (
                <Paper elevation={0} square className={classes.viewMediaInputWrapper}>
                  <IconButton
                    aria-label="cancel-upload"
                    component="span"
                    onClick={(e) => setMedias([])}
                  >
                    <CancelIcon className={classes.sendMessageIcons} />
                  </IconButton>
                  {loading ? (
                    <div>
                      <CircularProgress className={classes.circleLoading} />
                    </div>
                  ) : (
                    <span>
                      {medias[0]?.name}
                    </span>
                  )}
                  <IconButton
                    aria-label="send-upload"
                    component="span"
                    onClick={handleSendMedia}
                    disabled={loading}
                  >
                    <SendIcon className={classes.sendMessageIcons} />
                  </IconButton>
                </Paper>
              ) : (
                <React.Fragment>
                  <Input
                    multiline
                    value={contentMessage}
                    onKeyUp={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && contentMessage.trim() !== "") {
                        e.preventDefault();
                        handleSendMessage(contentMessage);
                        setContentMessage("");
                      }
                    }}
                    onChange={(e) => setContentMessage(e.target.value)}
                    className={classes.input}
                    inputProps={{
                      "aria-label": "message input",
                      "accept-charset": "UTF-8",
                      "data-testid": "message-input",
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <FileInput disableOption={loading} handleChangeMedias={handleChangeMedias} />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        {contentMessage ? (
                          <IconButton
                            onClick={() => {
                              if (contentMessage.trim() !== "") {
                                handleSendMessage(contentMessage);
                                setContentMessage("");
                              }
                            }}
                            className={classes.buttonSend}
                          >
                            <SendIcon />
                          </IconButton>
                        ) : (
                          <IconButton
                            aria-label="showRecorder"
                            component="span"
                            disabled={loading}
                            onClick={handleStartRecording}
                          >
                            <MicIcon className={classes.sendMessageIcons} />
                          </IconButton>
                        )}
                      </InputAdornment>
                    }
                  />
                </React.Fragment>
              )}
            </>
          )}
        </FormControl>
      </div>
    </Paper>
  );
}

const FileInput = (props) => {
  const { handleChangeMedias, disableOption } = props;
  const classes = useStyles();
  return (
    <>
      <input
        multiple
        type="file"
        id="upload-button"
        disabled={disableOption}
        className={classes.uploadInput}
        onChange={handleChangeMedias}
        accept="image/*, video/*, audio/*"
      />
      <label htmlFor="upload-button">
        <IconButton
          aria-label="upload"
          component="span"
          disabled={disableOption}
        >
          <AttachFileIcon className={classes.sendMessageIcons} />
        </IconButton>
      </label>
    </>
  );
};
