# Settings.json specification

This documentation explains how do you configure thunderbot to reply messages

## Usage Example
```json
{
    "bot": 
    {
        "show_online_status": true,
        "answer_groups": false,
        "log_messages": {
            "activated": true,
            "maximum_logsize_bytes": 1024
        },
        "events":
        {
            "on_message_received": 
			[
				{
					"case_sensitivity": true,
					"message_exact_text": [ "hi", "hello" ],
					"answer_to_exact_text": "hi, i'm a bot",
					"message_contains_text": [ "test" ],
                    "answer_to_contains_text": "we found a string test on your message"
				}
            ]
        },
        "default_answer": 
        {
            "answer": "I just understand \"hi\" or \"hello\"",
            "answer_by_timeofday_enabled": true,
            "answers": 
            {
                "morning": "time to eat a breakfast",
                "afternoon": "/path/to/afternoon.txt",
                "night": "/path/to/night.txt",
                "dawn": "/path/to/dawn.txt"
            }          
        }
    }
}

```

## File location
The [settings file](../settings/settings.json) must be inside a folder called *settings* on the same path of thunderbot binary file.

## Live loading
The [settings](../settings/settings.json) file can be edited while thunderbot is running.

## Fields

* **bot**
  * **_show_online_status_**
    * true if the status 'online' must be visible to your contacts, false otherwise

  * **_answer_groups_**
    * true to repond group messages, false otherwise
  
  * **_log_messages_**
    * **_activated_** - true to save received messages in a file on disk, false otherwise
    
    * **_maximum_logsize_bytes_** - maximum size in bytes of each log file

  * **_events_**
    * **_on message received_**
      * **_case_sensitivity_** - true if the content of messages must be threated exactly as it is, false otherwise

      * **_message_exact_text_** - array containing all message texts to be searched exactly

      * **_answer_to_exact_text_** - string containing a response when one of the previous message texts has been found on received

      * **_message_contains_text_** - array containing all texts to be searched on received message

      * **_answer_to_contains_text_** - response to deliver when one of the previous texts was found on received message
  
  * **_default_answer_**
    * **answer** - default answer to be delivered when none of the previous configured messages is found in content of the received message

    * **answer_by_timeofday_enabled** - true if the response is sent according to the time of day

      * **_morning_** - string containing a path to file that contains the response or a string containing the response to be sent when it's morning

      * **_afternoon_** - string containing a path to file that contains the response or a string containing the response to be sent when it's afternoon

      * **_night_** - string containing a path to file that contains the response or a string containing the response to be sent when it's night

      * **_dawn_** - string containing a path to file that contains the response or a string containing the response to be sent when it's dawn
