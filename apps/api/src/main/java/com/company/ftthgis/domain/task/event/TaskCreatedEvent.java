package com.company.ftthgis.domain.task.event;

import com.company.ftthgis.domain.task.entity.Task;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Spring application event published when a new Task/Ticket is created.
 */
@Getter
public class TaskCreatedEvent extends ApplicationEvent {
    private final Task task;

    public TaskCreatedEvent(Object source, Task task) {
        super(source);
        this.task = task;
    }
}
