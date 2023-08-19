import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';


import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';


export default function ButtonAppBar() {
    const [state, setState] = React.useState({
        left: false,
    });
    const menuList = [{
        title: 'Original ChatGPT',
        url: '/raw-response-generator'
    },{
        title: 'Text Generator',
        url: '/text-generator'
    }, {
        title: 'URL Scraper',
        url: '/url-scraper'
    }, {
        title: 'Social Media Tool',
        url: '/social-media-tool'
    }, {
        title: 'Image Describer',
        url: '/image-describer'
    }, {
        title: 'Google Ads',
        url: '/google-ads'
    }, {
        title: 'On Audit',
        url: '/on-audit'
    }, {
        title: 'Image Compressor',
        url: '/image-compressor'
    }];
    const styles = {
        logo: {
            height: 100,
            margin: "auto"
        },
        title: {
            display: "inline",
            marginTop: "25px",
            marginLeft: "15px",
            fontSize: "25px",
            fontWeight: "bold",
            whiteSpace: "nowrap"
        },
    };

    const toggleDrawer = (anchor, open) => (event) => {
        setState({ ...state, [anchor]: open });
    };

    function CustomSwipeableDrawerList(anchor){
        return (
        <Box
            sx={{ width: 250 }}
            role="presentation"
            onClick={toggleDrawer(anchor, false)}
            onKeyDown={toggleDrawer(anchor, false)}
        >
            <List>
            {menuList.map((item) => (
                <ListItem key={item.title} disablePadding>
                <ListItemButton onClick={() => {
                    window.location.href = item.url;
                }}>
                    <ListItemText primary={item.title} />
                </ListItemButton>
                </ListItem>
            ))}
            </List>
        </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" style={{ height: "150px", backgroundColor: "#052243" }}>
            <Toolbar>
                <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{ mr: 2 }}
                    onClick={() => {                
                        setState({ ...state, left: !state["left"] });
                    }}
                >
                    <SwipeableDrawer
                        anchor={'left'}
                        open={state['left']}
                        onClose={toggleDrawer('left', false)}
                        onOpen={toggleDrawer('left', true)}
                    >
                        {CustomSwipeableDrawerList('left')}
                    </SwipeableDrawer>
                    <MenuIcon />
                </IconButton>
                <div style={{ width: "20%", margin: "auto", display: "flex", flexDirection: "row", paddingTop: "25px" }}>
                    <Typography variant="h6" component="span" style={styles.title}>
                        Flask Menu Tool
                    </Typography>
                </div>
            </Toolbar>
        </AppBar>
        </Box>
    );
}