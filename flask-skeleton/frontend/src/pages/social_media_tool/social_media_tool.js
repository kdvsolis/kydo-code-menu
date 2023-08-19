import { useState, useEffect } from 'react';

import "./social_media_tool.css";

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import useMediaQuery from '@mui/material/useMediaQuery';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import text_generator from "../../services/text-generator-service";


function SocialMediaTool(){
    const [mainSentence, setMainSentence] = useState("");
    const [labelSentence, setLabelSentence] = useState("");
    const [post, setPost] = useState("");
    const [output, setOutput] = useState([]);
    const [loading, setLoading] = useState(false);

    const labels = {
        "Generate an Instagram Caption": "What is your post about?",
        "Generate an Instagram Story Ideas": "Enter a topic",
        "Generate TikTok Video Ideas": "Enter a topic",
        "Generate a YouTube Title": "Enter a topic",
        "Generate a LinkedIn Post": "What is your video about? / Enter your keywords",
        "Generate a Facebook Post": "Enter a topic",
        "Generate a Pinterest Post": "Enter a topic",
        "Generate a Tweet": "What is the topic?",
        "Generate a Pinterest Post": "What is your post about?",
    }
    
    useEffect(() => {
        console.log('output', output);
    }, [output])
    return (    
        <div>
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#3f51b5',
                width: 1,
                height: 0.15
            }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: 'auto',
                    color: 'white'
                }}>
                    <h1>Text Generator</h1>
                    <p>Powered by ChatGPT</p> 
                </Box>
            </Box>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-around',
                width: 1
            }}>
                
            </Box>
            <Grid container direction={ useMediaQuery('(min-width:600px)')? "row" : "column" } rowSpacing={1} columnSpacing={{ xs: 7, sm: 8, md: 9 }}>
                <Grid item xs={5}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        p: 3,
                        m: 2,
                        gap: 1,
                        width: useMediaQuery('(min-width:600px)')? 1 : "auto" 
                    }}>
                            <FormControl fullWidth>
                                <InputLabel id="post-select-label">Select Post</InputLabel>
                                <Select
                                    labelId="post-select-label"
                                    id="post-select"
                                    value={post}
                                    label="Post"
                                    onChange={(event) => {
                                        setPost(event.target.value);
                                        setLabelSentence(labels[event.target.value]);
                                    }}
                                >
                                    <MenuItem value={"Generate an Instagram Caption"}>Generate an Instagram Caption:</MenuItem>
                                    <MenuItem value={"Generate an Instagram Story Ideas"}>Generate an Instagram Story Ideas:</MenuItem>
                                    <MenuItem value={"Generate TikTok Caption"}>Generate TikTok Caption:</MenuItem>
                                    <MenuItem value={"Generate TikTok Video Ideas"}>Generate TikTok Video Ideas:</MenuItem>
                                    <MenuItem value={"Generate a YouTube Title"}>Generate a YouTube Title:</MenuItem>
                                    <MenuItem value={"Generate a LinkedIn Post"}>Generate a LinkedIn Post:</MenuItem>
                                    <MenuItem value={"Generate a Facebook Post"}>Generate a Facebook Post:</MenuItem>
                                    <MenuItem value={"Generate a Tweet"}>Generate a Tweet:</MenuItem>
                                    <MenuItem value={"Generate a Pinterest Post"}>Generate a Pinterest Post:</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField 
                                id="main-sentence" 
                                label={labelSentence}
                                variant="outlined"
                                defaultValue=""
                                onChange={(event) => setMainSentence(event.target.value)} 
                            />
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'row-reverse'
                            }}>
                                <Button variant="contained" onClick={async()=> {
                                    setLoading(true);
                                    text_generator.generateRawResponse(`${post} about ${mainSentence}`).then(rawResponse => {
                                        setOutput([{
                                            title: "Result",
                                            result: rawResponse.result.replace(/(?:\r\n|\r|\n)/g, "<br/>")
                                        }]);
                                        setLoading(false);
                                    });
                                }}>{
                                    loading && <CircularProgress size={16} style={{'color': "white"}} />
                                }
                                {
                                    !loading && 'Generate'
                                }</Button>
                                <Button variant="contained" style={{'marginRight': '10px'}} onClick={async()=> {
                                    setOutput([]);
                                }}>Clear List</Button>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={5}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            p: 3,
                            m: 2,
                            gap: 1,
                            width: useMediaQuery('(min-width:600px)')? 1 : "auto" 
                        }}>
                            {
                                output.map(x => {
                                    return (
                                        <Accordion defaultExpanded={true}>
                                            <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1a-content"
                                            id="panel1a-header"
                                            >
                                            <Typography>{x.title}</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                            <div dangerouslySetInnerHTML={{__html: x.result}} />
                                            </AccordionDetails>
                                        </Accordion>
                                    );
                                })
                            }
                        </Box>
                    </Grid>
            </Grid>
        </div>
    );
}

export default SocialMediaTool;