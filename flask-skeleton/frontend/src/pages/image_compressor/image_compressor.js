import { useState, useEffect } from 'react';

import "./image_compressor.css";

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';

import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';



import text_generator from "../../services/text-generator-service";


function ImageCompressor(){
    const [imageFile, setImageFile] = useState("");
    const [quality, setQuality] = useState("q_60");
    const [mainSentence, setMainSentence] = useState("");
    const [output, setOutput] = useState([]);
    const [loading, setLoading] = useState(false);
    
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
                            <TextField 
                                id="main-sentence" 
                                label="Enter image URL" 
                                variant="outlined"
                                defaultValue=""
                                onChange={(event) => setMainSentence(event.target.value)} 
                            />
                            <img src={imageFile != ""? `https://res.cloudinary.com/dz4jj7y1y/image/upload/w_600/${quality}/${imageFile}` : ""} width="403" height="250" style={{ "object-fit": "contain" }}></img>
                            <span>Slide to change quality</span>
                            <Slider
                                aria-label="Quality"
                                defaultValue={60}
                                getAriaValueText={(value) => {
                                    return `${value}`;
                                }}
                                valueLabelDisplay="auto"
                                step={10}
                                marks
                                min={10}
                                max={100}
                                onChange={(event) => {
                                    const image = `${imageFile}`
                                    setQuality(`q_${event.target.value}`)
                                    setImageFile("");
                                    setImageFile(image);
                                }}
                            />
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'row-reverse'
                            }}>
                                <Button variant="contained" onClick={async()=> {
                                    setLoading(true);
                                    let fileNameStart = mainSentence.lastIndexOf('/') + 1;
                                    let fileNameEnd = mainSentence.lastIndexOf('.');
                                    text_generator.imageCompressable(mainSentence, mainSentence.substring(fileNameStart, fileNameEnd)).then(rawResponse => {
                                        setImageFile(`${rawResponse.public_id}.${rawResponse.format}`);
                                        setLoading(false);
                                    }).catch(err => {
                                        alert("Something went wrong");
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
                    {/* <Grid item xs={5}>
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
                                        <Accordion>
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
                    </Grid> */}
            </Grid>
        </div>
    );
}

export default ImageCompressor;