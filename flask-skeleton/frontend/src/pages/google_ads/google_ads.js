import { useState, useEffect } from 'react';

import "./google_ads.css";

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import text_generator from "../../services/text-generator-service";


function GoogleAds(){
    const [brandName, setBrandName] = useState("");
    const [brandDescription, setBrandDescription] = useState("");
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
                                id="brand-name" 
                                label="Enter a product/company name" 
                                variant="outlined"
                                defaultValue=""
                                onChange={(event) => setBrandName(event.target.value)} 
                            />
                            <TextField
                                id="brand-description"
                                label="Enter a product/company description"
                                multiline
                                rows={4}
                                defaultValue=""
                                value={brandDescription}
                                onChange={(event) => setBrandDescription(event.target.value)} 
                            />
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'row-reverse'
                            }}>
                                <Button variant="contained" onClick={async()=> {
                                    setLoading(true);
                                    const mainSentence = `Give me and ad prompt for brand ${brandName} which is described as ${brandDescription}`
                                    text_generator.generateRawResponse(mainSentence).then(rawResponse => {
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
                    </Grid>
            </Grid>
        </div>
    );
}

export default GoogleAds;